import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function bump(kind: 'light' | 'heavy' | 'success' | 'error') {
  if (Platform.OS === 'web') return;
  const run = async () => {
    if (kind === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (kind === 'error') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    return Haptics.impactAsync(kind === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
  };
  run().catch(() => {});
}
