import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// How notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async send(title: string, body: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null, // immediate
    });
  },

  async sendQuestComplete(questTitle: string, xpGained: number): Promise<void> {
    await NotificationService.send(
      '[Quest Complete.]',
      `${questTitle} — +${xpGained} XP acquired.`,
    );
  },

  async sendLevelUp(newLevel: number): Promise<void> {
    await NotificationService.send(
      '[Level Increased.]',
      `You have reached Level ${newLevel}. All stats have been enhanced.`,
    );
  },

  async sendRewardReceived(itemName: string, rarity: string): Promise<void> {
    await NotificationService.send('[Item Acquired.]', `${rarity} item obtained: ${itemName}.`);
  },

  async sendPenaltyWarning(): Promise<void> {
    await NotificationService.send(
      '[Penalty Countdown Initiated.]',
      'Daily quests remain incomplete. Failure approaches.',
    );
  },

  /**
   * Schedules a daily local notification at the given hour (24h).
   * Cancels any existing daily quest reminder first to avoid duplicates.
   */
  async scheduleDailyQuestReminder(hour = 8, minute = 0): Promise<void> {
    // Cancel existing daily reminder
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.title === '[Daily Quest has arrived.]') {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '[Daily Quest has arrived.]',
        body: 'New challenges await, Hunter. Rise and conquer.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  },

  async cancelAllScheduled(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },
};
