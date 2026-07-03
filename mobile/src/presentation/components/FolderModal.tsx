import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Colors, FontSize, Fonts, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';
import { ItemCard } from './ItemCard';
import { DynamicItem, ItemType } from '../../domain/models/DynamicItem';

interface Props {
  visible: boolean;
  folder: { type: ItemType; label: string; icon: string } | null;
  /** Items pre-sorted by the screen (rarest first) — the modal does not re-sort. */
  items: DynamicItem[];
  onSelectItem: (item: DynamicItem) => void;
  onClose: () => void;
}

/**
 * A Solo Leveling "system window" that opens when an inventory folder is tapped —
 * styled after {@link SystemNoticeModal}: dark backdrop, glowing accent-bordered
 * panel, pixel typography. Shows the folder's items as tappable ItemCards.
 */
export function FolderModal({ visible, folder, items, onSelectItem, onClose }: Props) {
  const { height } = useWindowDimensions();

  if (!folder) return null;

  const isEmpty = items.length === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.panel, { maxHeight: height * 0.7 }]}>
          <Text style={styles.header}>
            {folder.icon}  [ {folder.label} ]
          </Text>
          <Text style={styles.count}>
            {items.length} ITEM{items.length !== 1 ? 'S' : ''}
          </Text>

          {isEmpty ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>[Folder Empty]</Text>
              <Text style={styles.emptyDesc}>
                {folder.type === 'weapon'
                  ? 'No gear yet. The Gates hold what the daily grind does not.'
                  : 'Complete quests to earn context-aware reward items from the Architect.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item) => (
                <ItemCard key={item.id} item={item} onPress={onSelectItem} />
              ))}
            </ScrollView>
          )}

          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.75),
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.accent,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.glow(Colors.accent),
  },
  header: {
    fontFamily: Fonts.pixel,
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
  },
  count: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  body: {
    alignSelf: 'stretch',
  },
  bodyContent: {
    paddingTop: Spacing.xs,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 1,
  },
  emptyDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 16,
  },
  button: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: withAlpha(Colors.accent, 0.1),
  },
  buttonText: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    color: Colors.accent,
  },
});
