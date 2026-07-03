import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Fonts, Spacing, Radius, Shadow, Typography, withAlpha } from '../../core/theme';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuestStore } from '../stores/useQuestStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { XPBar } from '../components/XPBar';
import { RankBadge } from '../components/RankBadge';
import { QuestCard } from '../components/QuestCard';
import { Rank } from '../../core/constants';
import { RootStackParamList } from '../../core/navigation';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { player, loading: playerLoading } = usePlayerStore();
  const { quests, loading: questsLoading } = useQuestStore();
  const itemCount = useInventoryStore((s) => s.items.length);

  const activeQuests = quests.filter((q) => !q.isCompleted).slice(0, 3);
  const loading = playerLoading || questsLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header — welcome + name stack on the left, RANK drops to its own line
            below so the top-right corner stays clear of the on-device overlay. */}
        <View style={styles.header}>
          <Text style={styles.welcome}>WELCOME BACK,</Text>
          <Text style={styles.playerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
            {player?.name ?? '—'}
          </Text>
          <View style={styles.rankWrap}>
            <RankBadge rank={(player?.rank?.charAt(0) ?? 'E') as Rank} />
          </View>
        </View>

        {/* XP Bar */}
        {player && (
          <XPBar
            level={player.level}
            experience={player.experience}
            experienceToNextLevel={player.experienceToNextLevel}
          />
        )}

        {/* Stats snapshot */}
        {player && (
          <View style={styles.statsRow}>
            {(['strength', 'agility', 'intelligence', 'mindfulness'] as const).map((key) => (
              <View key={key} style={styles.statBox}>
                <Text style={styles.statVal}>{player.stats[key]}</Text>
                <Text style={styles.statKey}>{key.slice(0, 3).toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Inventory shortcut */}
        <Pressable
          style={({ pressed }) => [styles.inventoryBtn, pressed && styles.inventoryBtnPressed]}
          onPress={() => navigation.navigate('Inventory')}
        >
          <Text style={styles.inventoryIcon}>🎒</Text>
          <View style={styles.inventoryInfo}>
            <Text style={styles.inventoryTitle}>INVENTORY</Text>
            <Text style={styles.inventorySub}>
              {itemCount} reward{itemCount !== 1 ? 's' : ''} stored
            </Text>
          </View>
          <Text style={styles.inventoryChevron}>›</Text>
        </Pressable>

        {/* Active quests */}
        <Text style={styles.sectionTitle}>Active Quests</Text>
        {loading && <ActivityIndicator color={Colors.primary} />}
        {!loading && activeQuests.length === 0 && (
          <Text style={styles.empty}>[All quests completed for today.]</Text>
        )}
        {activeQuests.map((q) => (
          <QuestCard key={q.id} quest={q} />
        ))}
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
    gap: Spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    // Keep-out gutter: the name shrinks to fit this reduced width so it never
    // grows into the top-right corner where the on-device overlay hovers.
    paddingRight: 52,
  },
  rankWrap: {
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },
  welcome: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
  },
  playerName: {
    ...Typography.title,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.card,
  },
  statVal: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
  },
  statKey: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
  },
  inventoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.33),
    padding: Spacing.md,
    ...Shadow.card,
  },
  inventoryBtnPressed: {
    opacity: 0.7,
  },
  inventoryIcon: {
    fontSize: 20,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
  inventorySub: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  inventoryChevron: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
  },
  sectionTitle: {
    ...Typography.heading,
  },
  empty: {
    // No fontStyle: 'italic' — the pixel font has no italic face, so the
    // renderer shears it synthetically and the glyphs smear.
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 16,
    paddingVertical: Spacing.lg,
  },
});
