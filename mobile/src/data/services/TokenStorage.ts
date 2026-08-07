import * as SecureStore from 'expo-secure-store';

// Encrypted, device-side storage for the JWT pair. Kept in SecureStore (Keychain /
// Keystore) rather than SQLite so tokens never sit in a plain WAL file. The data
// layer reads these on every request; the presentation layer never touches them.

const ACCESS_TOKEN_KEY = 'systemos_access_token';
const REFRESH_TOKEN_KEY = 'systemos_refresh_token';

export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
