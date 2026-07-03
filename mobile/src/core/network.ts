import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export async function isOnline(): Promise<boolean> {
  const state: NetInfoState = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Subscribe to connectivity changes.
 * Returns an unsubscribe function.
 */
export function onConnectivityChange(
  callback: (online: boolean) => void,
): () => void {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected === true && state.isInternetReachable !== false);
  });
}
