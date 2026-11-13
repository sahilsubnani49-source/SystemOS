import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Fonts, FontSize, Radius, Shadow, Spacing, Typography } from '../../core/theme';
import { GatePortal } from '../components/GatePortal';
import type { RootStackParamList } from '../../core/navigation';

/**
 * The Apps tab: launchers for companion apps that run inside SystemOS. Each app owns
 * its own screens and data and reports back through a bridge (Kotodama → Hunter Log).
 * Add new apps as further portals or cards in this list.
 */
export function AppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Apps</Text>
        <Text style={styles.subtitle}>Gates to other worlds. Time spent inside counts.</Text>

        {/* Kotodama, the Japanese-learning RPG (games/kotodama). */}
        <GatePortal onPress={() => navigation.navigate('Kotodama')} />

        {/* Yotei, the planner app (apps/yotei). */}
        <Pressable
          onPress={() => navigation.navigate('Yotei')}
          style={({ pressed }) => [styles.appCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open Yotei, the planner"
        >
          <Text style={styles.appIcon}>予</Text>
          <View style={styles.appInfo}>
            <Text style={styles.appName}>YOTEI</Text>
            <Text style={styles.appDesc}>Paste a plan. See today, this week, this year.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.title,
    // Keep-out gutter so the title never grows into the top-right corner where
    // the on-device overlay hovers (matches the Dashboard header).
    paddingRight: 52,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  pressed: { opacity: 0.7 },
  appIcon: { fontSize: 28, color: Colors.primary, width: 40, textAlign: 'center' },
  appInfo: { flex: 1, gap: 4 },
  appName: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  appDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 14,
  },
  chevron: { color: Colors.textSecondary, fontSize: 24 },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 14,
  },
});
