import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow, withAlpha } from '../../core/theme';
import { useInventoryStore } from '../stores/useInventoryStore';
import { ItemDetailModal } from '../components/ItemDetailModal';
import { FolderModal } from '../components/FolderModal';
import { useSystemDialog } from '../components/SystemDialog';
import { DynamicItem, ItemType } from '../../domain/models/DynamicItem';
import { Rarity } from '../../core/constants';

const FOLDERS: { type: ItemType; label: string; icon: string }[] = [
  { type: 'token', label: 'TOKENS', icon: '🎟️' },
  { type: 'potion', label: 'POTIONS', icon: '🧪' },
  { type: 'weapon', label: 'WEAPONS', icon: '⚔️' },
];

/** Display order inside a folder: rarest first. */
const RARITY_ORDER: Rarity[] = ['Legendary', 'Epic', 'Rare', 'Common'];

export function InventoryScreen() {
  const { items, loading, load, redeemItem } = useInventoryStore();
  const [selected, setSelected] = useState<DynamicItem | null>(null);
  const [openFolder, setOpenFolder] = useState<ItemType | null>(null);
  const systemAlert = useSystemDialog();

  // Hard-refresh from SQLite every time the tab gains focus, so items earned from
  // quest completions (added directly to the DB) always show up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleUse = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    // Close the detail modal BEFORE raising the confirm dialog — the System dialog is
    // itself a Modal, and two stacked RN Modals don't present reliably (same reason
    // FolderModal/ItemDetailModal are swapped, never nested).
    setSelected(null);
    systemAlert(
      '[Redeem Reward]',
      `Redeem "${item?.name ?? 'this reward'}"? It will be marked spent and removed permanently — it can never be recovered.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          style: 'destructive',
          onPress: async () => {
            const used = await redeemItem(itemId);
            if (used) {
              systemAlert(`[Reward Redeemed] ${used.name}`, used.description);
            }
          },
        },
      ],
    );
  };

  const byFolder = (type: ItemType) => items.filter((i) => i.type === type);
  const folderItems = openFolder
    ? byFolder(openFolder).sort(
        (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity),
      )
    : [];
  const activeFolder = FOLDERS.find((f) => f.type === openFolder) ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {items.length} item{items.length !== 1 ? 's' : ''} collected
        </Text>

        {/* Folders */}
        <View style={styles.folderRow}>
          {FOLDERS.map((f) => {
            const open = openFolder === f.type;
            return (
              <Pressable
                key={f.type}
                style={[styles.folder, open && styles.folderOpen]}
                onPress={() => setOpenFolder(f.type)}
              >
                <Text style={styles.folderIcon}>{open ? '📂' : '📁'}</Text>
                <Text style={[styles.folderLabel, open && styles.folderLabelOpen]}>{f.label}</Text>
                <Text style={styles.folderCount}>{byFolder(f.type).length}</Text>
              </Pressable>
            );
          })}
        </View>

        {loading && <ActivityIndicator color={Colors.primary} style={styles.loader} />}
      </ScrollView>

      {/* Folder window and item detail are swapped, never nested — two stacked RN
          Modals are unreliable on Android. Selecting an item hides the folder and
          reveals the detail; closing the detail brings the folder back. */}
      <FolderModal
        visible={openFolder !== null && selected === null}
        folder={activeFolder}
        items={folderItems}
        onSelectItem={setSelected}
        onClose={() => setOpenFolder(null)}
      />

      <ItemDetailModal item={selected} onClose={() => setSelected(null)} onUse={handleUse} />
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
    gap: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  folderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  folder: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: Spacing.sm,
    ...Shadow.card,
  },
  folderOpen: {
    borderColor: withAlpha(Colors.primary, 0.5),
    backgroundColor: withAlpha(Colors.primary, 0.12),
  },
  folderIcon: {
    fontSize: 18,
  },
  folderLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  folderLabelOpen: {
    color: Colors.textPrimary,
  },
  folderCount: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
});
