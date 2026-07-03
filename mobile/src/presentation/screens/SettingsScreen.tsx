import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow, Typography, withAlpha } from '../../core/theme';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuestStore } from '../stores/useQuestStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useTrainingStore } from '../stores/useTrainingStore';
import { useGoalStore } from '../stores/useGoalStore';
import { useSystemDialog } from '../components/SystemDialog';
import { ENV } from '../../core/env';

export function SettingsScreen() {
  const { player, updateBio } = usePlayerStore();
  const { reset: resetQuests } = useQuestStore();
  const { clear: clearInventory } = useInventoryStore();
  const systemAlert = useSystemDialog();

  const [bio, setBio] = useState(player?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const isCloud = player?.modelPreference === 'cloud';

  const handleSaveBio = async () => {
    setSaving(true);
    await updateBio(bio);
    setSaving(false);
    systemAlert('[System]', 'Bio updated. The Architect will use this for future rewards.');
  };

  const handleToggleModel = async () => {
    const next = isCloud ? 'local' : 'cloud';
    // Re-use updateBio to also persist model preference
    await usePlayerStore.getState().updateBio(player?.bio ?? '');
    // Directly update model preference via the same API call
    const { ApiDataSource } = await import('../../data/datasources/ApiDataSource');
    try {
      await ApiDataSource.updateProfile(player?.bio ?? '', next, player?.aspirations ?? '');
    } catch {
      // Offline — will sync later
    }
    // Update local store optimistically
    const current = usePlayerStore.getState().player;
    if (current) {
      const { PlayerRepository } = await import('../../data/repositories/PlayerRepository');
      const repo = new PlayerRepository();
      const updated = { ...current, modelPreference: next as 'local' | 'cloud' };
      await repo.savePlayer(updated);
      usePlayerStore.setState({ player: updated });
    }
  };

  const handleScram = () => {
    systemAlert(
      '[Warning]',
      'SCRAM wipes everything: level, XP, stats, rank, keys, your campaign, inventory, quests, dungeons, and shadow army. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe Everything',
          style: 'destructive',
          onPress: async () => {
            await usePlayerStore.getState().resetProgress();
            await resetQuests(); // deletes all quests + dungeons
            await clearInventory();
            await useTrainingStore.getState().resetTraining();
            await useGoalStore.getState().wipeAll(); // deletes goals + clears meta cursors
            systemAlert(
              '[System]',
              'Reset complete. You are an E-Rank Hunter once more. Forge a new campaign to begin again.',
            );
          },
        },
      ],
    );
  };

  const handleDailyReset = async () => {
    const count = await useQuestStore.getState().resetTodaysQuests();
    systemAlert(
      '[System]',
      count > 0
        ? `Daily reset complete. ${count} of today's quest${count > 1 ? 's' : ''} can be attempted again.`
        : "No quests scheduled for today to reset.",
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Campaign pointer — quest generation now lives in the Campaign tab */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaigns</Text>
          <Text style={styles.sectionDesc}>
            Quests are now generated from a goal and a timeline. Open the 🎯 Campaign tab to
            declare a goal, set how many days you have, and let the Quest Master forge your
            full plan of dated quests.
          </Text>
        </View>

        {/* Bio editor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Biography</Text>
          <Text style={styles.sectionDesc}>
            Tell the Architect about your life. The more detail you provide, the more
            personalized your reward items will be.
          </Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={6}
            placeholder="e.g. I'm a software engineer who travels frequently for work. I want to build habits around fitness and staying connected with loved ones..."
            placeholderTextColor={Colors.textSecondary}
          />
          <TouchableOpacity
            style={[styles.btn, saving && styles.btnDisabled]}
            onPress={handleSaveBio}
            disabled={saving}
          >
            <Text style={styles.btnText}>{saving ? 'Saving...' : 'Save Bio'}</Text>
          </TouchableOpacity>
        </View>

        {/* AI model preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Model</Text>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>
                {isCloud ? '☁️  Cloud AI' : '🔒  Local AI (Ollama)'}
              </Text>
              <Text style={styles.toggleDesc}>
                {isCloud
                  ? 'Uses Gemini / Claude / OpenAI for richer, more contextual rewards.'
                  : 'Uses a local Ollama model. Fully private — no data leaves your device.'}
              </Text>
            </View>
            <Switch
              value={isCloud}
              onValueChange={handleToggleModel}
              trackColor={{ false: Colors.surface, true: withAlpha(Colors.primary, 0.53) }}
              thumbColor={isCloud ? Colors.primary : Colors.textSecondary}
            />
          </View>
        </View>

        {/* Debug info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug</Text>
          <Text style={styles.debugLine}>API: {ENV.API_BASE_URL}</Text>
          <Text style={styles.debugLine}>Mode: {ENV.IS_DEV ? 'Development' : 'Production'}</Text>
          <Text style={styles.debugLine}>Player level: {player?.level ?? '—'}</Text>
        </View>

        {/* Danger zone */}
        <View style={[styles.section, styles.dangerSection]}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>

          <TouchableOpacity style={styles.dailyBtn} onPress={handleDailyReset}>
            <Text style={styles.dailyBtnText}>Run Daily Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.dangerBtn, styles.scramBtn]} onPress={handleScram}>
            <Text style={[styles.dangerBtnText, styles.scramBtnText]}>
              SCRAM — Reset All Progress
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  pendingBanner: {
    backgroundColor: withAlpha(Colors.orange, 0.13),
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.orange, 0.33),
  },
  pendingText: {
    color: Colors.orange,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 0.5,
  },
  sectionDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  bioInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 18,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
  },
  generateBanner: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  generateBannerSuccess: {
    backgroundColor: withAlpha(Colors.accent, 0.08),
    borderColor: withAlpha(Colors.accent, 0.33),
  },
  generateBannerError: {
    backgroundColor: withAlpha(Colors.error, 0.08),
    borderColor: withAlpha(Colors.error, 0.33),
  },
  generateBannerText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 14,
  },
  generateBannerTextSuccess: {
    color: Colors.accent,
  },
  generateBannerTextError: {
    color: Colors.error,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toggleLabel: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
  },
  toggleDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 14,
    maxWidth: '80%',
    marginTop: 2,
  },
  debugLine: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontFamily: 'monospace',
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: withAlpha(Colors.error, 0.27),
  },
  dangerTitle: {
    color: Colors.error,
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: Colors.error,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
  },
  dailyBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  dailyBtnText: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
  },
  scramBtn: {
    backgroundColor: withAlpha(Colors.error, 0.13),
    borderWidth: 2,
  },
  scramBtnText: {
    letterSpacing: 0.5,
  },
});
