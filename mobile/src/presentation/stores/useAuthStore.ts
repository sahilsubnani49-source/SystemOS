import { create } from 'zustand';
import { User } from '../../data/datasources/ApiTypes';
import { AuthService } from '../../data/services/AuthService';
import { TokenStorage } from '../../data/services/TokenStorage';

type AuthStatus = 'unknown' | 'loggedOut' | 'loggedIn';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  loading: boolean;
  error: string | null;
  /** Read stored tokens on launch and move status off 'unknown'. */
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'unknown',
  loading: false,
  error: null,

  initialize: async () => {
    // Offline-first: the presence of a refresh token means "this device has a
    // Hunter". We do NOT validate it here — network may be down, and a stale token
    // is handled lazily by the 401→refresh flow the first time an /api/* call runs.
    const refreshToken = await TokenStorage.getRefreshToken();
    set({ status: refreshToken ? 'loggedIn' : 'loggedOut' });
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const user = await AuthService.login(email, password);
      set({ user, status: 'loggedIn', loading: false, error: null });
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Invalid credentials.';
      set({ loading: false, error: `[Access Denied.] ${detail}` });
    }
  },

  signup: async (email: string, password: string, name?: string) => {
    set({ loading: true, error: null });
    try {
      const user = await AuthService.signup(email, password, name);
      set({ user, status: 'loggedIn', loading: false, error: null });
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Registration failed.';
      set({ loading: false, error: `[Registration Denied.] ${detail}` });
    }
  },

  logout: async () => {
    // Clears tokens only — the local SQLite cache is kept (offline-first).
    await AuthService.logout();
    set({ user: null, status: 'loggedOut', error: null });
  },

  clearError: () => set({ error: null }),
}));

// Bridge the data layer's session-expiry signal (from the 401→refresh flow giving
// up) into a forced logout, without the data layer importing this store directly.
AuthService.setOnSessionExpired(() => {
  useAuthStore.setState({
    user: null,
    status: 'loggedOut',
    error: '[Authentication Required.] Your session expired. Sign in again.',
  });
});
