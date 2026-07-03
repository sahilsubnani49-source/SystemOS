import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow, Typography, withAlpha } from '../../core/theme';
import { usePlayerStore } from '../stores/usePlayerStore';
import { STAT_KEYS, StatKey } from '../../core/constants';

const STAT_ICONS: Record<StatKey, string> = {
  strength: '⚔️',
  agility: '🏃',
  stamina: '❤️',
  intelligence: '🧠',
  perception: '👁️',
  discipline: '🎯',
  creativity: '✨',
  mindfulness: '🧘',
};

function StatBar({ label, value, icon }: { label: StatKey; value: number; icon: string }) {
  const fill = Math.min(value / 100, 1);
  return (
    <View style={barStyles.row}>
      <Text style={barStyles.icon}>{icon}</Text>
      <View style={barStyles.info}>
        <View style={barStyles.labelRow}>
          <Text style={barStyles.label}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
          <Text style={barStyles.value}>{value}</Text>
        </View>
        <View style={barStyles.track}>
          <View style={[barStyles.fill, { width: `${fill * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 16,
    width: 24,
    textAlign: 'center',
  },
  info: { flex: 1 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  label: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
  },
  value: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
  },
  track: {
    height: 6,
    backgroundColor: '#0E0E15',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
});

export function StatsScreen() {
  const { player, loading } = usePlayerStore();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Hunter Stats</Text>

        {loading && <ActivityIndicator color={Colors.primary} />}

        {player && (
          <>
            {/* Identity card */}
            <View style={styles.card}>
              <Text style={styles.playerName}>{player.name}</Text>
              <View style={styles.levelRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>LV {player.level}</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{(player.rank ?? 'E-Rank').toUpperCase()}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: player.modelPreference === 'local' ? '#1B5E20' : '#0D47A1' }]}>
                  <Text style={styles.pillText}>
                    {player.modelPreference === 'local' ? '🔒 LOCAL AI' : '☁️ CLOUD AI'}
                  </Text>
                </View>
              </View>
              {player.bio && (
                <Text style={styles.bio}>{player.bio}</Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Attributes</Text>
              {STAT_KEYS.map((key) => (
                <StatBar
                  key={key}
                  label={key}
                  value={player.stats[key]}
                  icon={STAT_ICONS[key]}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  playerName: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xl,
  },
  levelRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: withAlpha(Colors.primary, 0.2),
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  pillText: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  bio: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
});
