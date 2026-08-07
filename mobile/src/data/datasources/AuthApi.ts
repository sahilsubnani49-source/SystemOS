import axios from 'axios';
import { ENV } from '../../core/env';
import { ApiAuthResponse, ApiRefreshResponse } from './ApiTypes';

// A SEPARATE, bare axios instance with NO interceptors. The main ApiDataSource
// instance attaches Bearer tokens and runs the 401→refresh→retry flow; routing
// the auth calls through it would recurse (a failed login is a 401 that would try
// to "refresh" and loop). Keeping this instance interceptor-free also lets the
// real FastAPI `detail` message (e.g. "Invalid credentials") reach the caller
// instead of being flattened into a generic "API error 401".

// eslint-disable-next-line import/no-named-as-default-member -- axios.create on the default export is the canonical axios API
const authApi = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
});

/**
 * Turn an axios failure into an Error carrying the backend's `detail` string when
 * present (FastAPI puts human-readable auth errors there), otherwise a network /
 * timeout fallback so the store can surface a System-style message.
 */
function toAuthError(error: unknown): Error {
  // eslint-disable-next-line import/no-named-as-default-member -- axios.isAxiosError is the canonical guard
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.length > 0) {
      return new Error(detail);
    }
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. The System could not be reached.');
    }
    if (!error.response) {
      return new Error('Network error. The System could not be reached.');
    }
    return new Error(`Authentication failed (${error.response.status}).`);
  }
  return error instanceof Error ? error : new Error('Authentication failed.');
}

export const AuthApi = {
  async signup(email: string, password: string, name?: string): Promise<ApiAuthResponse> {
    try {
      const { data } = await authApi.post<ApiAuthResponse>('/auth/signup', {
        email,
        password,
        ...(name ? { name } : {}),
      });
      return data;
    } catch (e) {
      throw toAuthError(e);
    }
  },

  async login(email: string, password: string): Promise<ApiAuthResponse> {
    try {
      const { data } = await authApi.post<ApiAuthResponse>('/auth/login', { email, password });
      return data;
    } catch (e) {
      throw toAuthError(e);
    }
  },

  async refresh(refreshToken: string): Promise<ApiRefreshResponse> {
    try {
      const { data } = await authApi.post<ApiRefreshResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });
      return data;
    } catch (e) {
      throw toAuthError(e);
    }
  },
};
