import * as SecureStore from 'expo-secure-store';

// SystemOS account tokens, in the platform keychain. Shared contract with tokens.web.ts.
const ACCESS = 'yotei.access';
const REFRESH = 'yotei.refresh';

export const Tokens = {
  async get(): Promise<{ access: string | null; refresh: string | null }> {
    return { access: await SecureStore.getItemAsync(ACCESS), refresh: await SecureStore.getItemAsync(REFRESH) };
  },
  async set(access: string, refresh: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS, access);
    await SecureStore.setItemAsync(REFRESH, refresh);
  },
  async clear(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
};
