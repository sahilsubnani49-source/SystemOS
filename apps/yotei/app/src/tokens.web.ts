// Web build (development and tests only): expo-secure-store has no web implementation.
const ACCESS = 'yotei.access';
const REFRESH = 'yotei.refresh';
const ls = () => globalThis.localStorage;

export const Tokens = {
  async get(): Promise<{ access: string | null; refresh: string | null }> {
    return { access: ls()?.getItem(ACCESS) ?? null, refresh: ls()?.getItem(REFRESH) ?? null };
  },
  async set(access: string, refresh: string): Promise<void> {
    ls()?.setItem(ACCESS, access);
    ls()?.setItem(REFRESH, refresh);
  },
  async clear(): Promise<void> {
    ls()?.removeItem(ACCESS);
    ls()?.removeItem(REFRESH);
  },
};
