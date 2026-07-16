import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { AppNavigator } from './src/core/navigation';
import { useAppBootstrap } from './src/core/useAppBootstrap';
import { Colors, FontSize, Fonts } from './src/core/theme';
import { SystemNoticeModal } from './src/presentation/components/SystemNoticeModal';
import { SpaceBackground } from './src/presentation/components/SpaceBackground';
import { SystemDialogProvider } from './src/presentation/components/SystemDialog';
import { useQuestStore } from './src/presentation/stores/useQuestStore';
import { getMeta, deleteMeta } from './src/data/services/AppMeta';
import { PENALTY_NOTICE_KEY } from './src/data/services/DailyTimelineService';

function AppContent() {
  const { ready } = useAppBootstrap();
  const [notice, setNotice] = useState<{ show: boolean; penaltyDate: string | null }>({
    show: false,
    penaltyDate: null,
  });

  // Once boot finishes (stores loaded, timeline ticked), greet the Hunter: announce
  // any overnight penalty and remind them the System expects today's quests done.
  useEffect(() => {
    if (!ready) return;
    (async () => {
      const penaltyDate = await getMeta(PENALTY_NOTICE_KEY);
      const hasPending = useQuestStore.getState().quests.some((q) => !q.isCompleted);
      if (penaltyDate || hasPending) setNotice({ show: true, penaltyDate });
    })();
  }, [ready]);

  const dismissNotice = () => {
    deleteMeta(PENALTY_NOTICE_KEY).catch(() => {});
    setNotice((n) => ({ ...n, show: false }));
  };

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>SYSTEM OS</Text>
        <Text style={styles.splashSub}>[Initializing...]</Text>
        <ActivityIndicator color={Colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <SystemDialogProvider>
      <AppNavigator />
      <SystemNoticeModal
        visible={notice.show}
        penaltyDate={notice.penaltyDate}
        onDismiss={dismissNotice}
      />
    </SystemDialogProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ PressStart2P_400Regular });

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SpaceBackground />
      {fontsLoaded ? (
        <AppContent />
      ) : (
        <View style={styles.splash}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splash: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splashTitle: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xxl,
    letterSpacing: 4,
  },
  splashSub: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 2,
  },
  spinner: {
    marginTop: 16,
  },
});
