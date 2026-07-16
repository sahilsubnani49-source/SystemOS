import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Colors,
  FontSize,
  Fonts,
  Radius,
  Spacing,
  Shadow,
  RarityColors,
  withAlpha,
} from '../../core/theme';
import { DynamicItem } from '../../domain/models/DynamicItem';
import { ItemCard } from './ItemCard';
import { LevelUpText } from './LevelUpText';

interface Props {
  item: DynamicItem | null;
  onClose: () => void;
  /** The level-up / +XP burst, rendered ON TOP of the modal so it isn't hidden by it. */
  burst?: { token: number; label: string };
}

export function RewardModal({ item, onClose, burst }: Props) {
  if (!item) return null;
  const glowColor = RarityColors[item.rarity] ?? Colors.primary;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, Shadow.glow(glowColor)]}>
          <Text style={styles.systemMsg}>[REWARD ACQUIRED]</Text>
          <Text style={[styles.rarityLabel, { color: glowColor }]}>
            {item.rarity.toUpperCase()} REWARD
          </Text>
          <ItemCard item={item} />
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: glowColor },
              pressed && styles.btnPressed,
            ]}
            onPress={onClose}
          >
            <Text style={styles.btnText}>CLAIM</Text>
          </Pressable>
        </View>
        {/* Rendered last + absolutely positioned → floats above the reward card. */}
        {burst && <LevelUpText token={burst.token} label={burst.label} />}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.8),
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
  },
  systemMsg: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 2,
    textAlign: 'center',
  },
  rarityLabel: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xl,
    letterSpacing: 2,
    textAlign: 'center',
  },
  btn: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 1.5,
  },
});
