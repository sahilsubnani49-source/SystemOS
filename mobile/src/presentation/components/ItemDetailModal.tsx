import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow, RarityColors, withAlpha } from '../../core/theme';
import { DynamicItem } from '../../domain/models/DynamicItem';

const TYPE_ICON: Record<string, string> = { token: '🎟️', potion: '🧪', weapon: '⚔️' };
const TYPE_LINE: Record<string, string> = {
  token: 'TOKEN · leisure & social',
  potion: 'POTION · rest & self-care',
  weapon: 'WEAPON · gear',
};

interface Props {
  item: DynamicItem | null;
  onClose: () => void;
  onUse?: (id: string) => void;
}

export function ItemDetailModal({ item, onClose, onUse }: Props) {
  if (!item) return null;
  const glow = RarityColors[item.rarity] ?? Colors.primary;
  const typeLine = TYPE_LINE[item.type] ?? TYPE_LINE.token;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { borderColor: withAlpha(glow, 0.5) }, Shadow.glow(glow)]}>
          <View style={[styles.headerBar, { borderBottomColor: withAlpha(glow, 0.35) }]}>
            <Text style={styles.headerText}>[ REWARD ]</Text>
            <Text style={[styles.rarityTag, { color: glow }]}>{item.rarity.toUpperCase()}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.titleRow}>
              <Text style={styles.icon}>{TYPE_ICON[item.type] ?? '🎁'}</Text>
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <Text style={styles.typeLine}>{typeLine}</Text>

            <Text style={styles.sectionLabel}>WHAT YOU'VE EARNED</Text>
            <Text style={styles.description}>{item.description}</Text>

            <Text style={styles.note}>
              Redeeming marks this reward as spent and removes it permanently. Go enjoy it — you earned it.
            </Text>
          </ScrollView>

          {onUse && (
            <Pressable
              style={({ pressed }) => [styles.useBtn, { backgroundColor: glow }, pressed && styles.pressed]}
              onPress={() => onUse(item.id)}
            >
              <Text style={styles.useText}>REDEEM</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.closeText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.82),
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  panel: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    backgroundColor: Colors.surface,
  },
  headerText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 2,
  },
  rarityTag: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 28,
  },
  name: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xl,
    letterSpacing: 0.5,
    flex: 1,
  },
  typeLine: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 2,
    marginTop: Spacing.md,
  },
  description: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  note: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 14,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  useBtn: {
    margin: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  useText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 1.5,
  },
  pressed: {
    opacity: 0.7,
  },
  closeBtn: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  closeText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1.5,
  },
});
