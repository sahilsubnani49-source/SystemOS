import { AuthApi } from '../datasources/AuthApi';
import { apiUserToDomain, User } from '../datasources/ApiTypes';
import { TokenStorage } from './TokenStorage';
import { reconcileDeviceBinding } from './DeviceBindingService';

// The session bridge between the data and presentation layers. The 401→refresh flow
// in ApiDataSource lives in the data layer and must NOT import a Zustand store
// (that would invert the layering and create a cycle). Instead the store registers
// a callback here; when refresh ultimately fails the data layer notifies through it.

type SessionExpiredCallback = () => void;
let onSessionExpired: SessionExpiredCallback | null = null;

// Concurrent 401s (e.g. dashboard fires 4 parallel requests) must share ONE refresh
// call, not stampede /auth/refresh with the same soon-to-be-rotated token. This
// holds the single in-flight refresh promise.
let refreshInFlight: Promise<string> | null = null;

export const AuthService = {
  setOnSessionExpired(cb: SessionExpiredCallback): void {
    onSessionExpired = cb;
  },

  notifySessionExpired(): void {
    onSessionExpired?.();
  },

  async signup(email: string, password: string, name?: string): Promise<User> {
    const res = await AuthApi.signup(email, password, name);
    await TokenStorage.setTokens(res.access_token, res.refresh_token);
    const user = apiUserToDomain(res.user);
    // Device binding: adopt local data on first login, or wipe + rebind on account switch.
    await reconcileDeviceBinding(user.id);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const res = await AuthApi.login(email, password);
    await TokenStorage.setTokens(res.access_token, res.refresh_token);
    const user = apiUserToDomain(res.user);
    await reconcileDeviceBinding(user.id);
    return user;
  },

  async logout(): Promise<void> {
    // Clear only the tokens — offline-first means the local SQLite cache stays put
    // so a re-login by the same Hunter is instant and works offline.
    await TokenStorage.clear();
  },

  /**
   * Exchange the refresh token for a fresh access token. Single-flight: concurrent
   * callers await the same promise. On failure, tokens are cleared and the error
   * rethrown so the 401 handler falls through to session-expiry.
   */
  async refreshTokens(): Promise<string> {
    if (refreshInFlight) return refreshInFlight;

    refreshInFlight = (async () => {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available.');
      }
      try {
        const res = await AuthApi.refresh(refreshToken);
        await TokenStorage.setTokens(res.access_token, res.refresh_token);
        return res.access_token;
      } catch (e) {
        await TokenStorage.clear();
        throw e;
      }
    })();

    try {
      return await refreshInFlight;
    } finally {
      refreshInFlight = null;
    }
  },
};
