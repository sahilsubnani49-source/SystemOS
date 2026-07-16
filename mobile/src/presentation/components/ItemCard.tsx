import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
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

const TYPE_ICON: Record<string, string> = { token: '🎟️', potion: '🧪', weapon: '⚔️' };
const TYPE_LABEL: Record<string, string> = {
  token: 'TOKEN · leisure',
  potion: 'POTION · rest & self-care',
  weapon: 'WEAPON · gear',
};

interface Props {
  item: DynamicItem;
  onPress?: (item: DynamicItem) => void;
}

export function ItemCard({ item, onPress }: Props) {
  const rarityColor = RarityColors[item.rarity] ?? Colors.textSecondary;

  return (
    <Pressable
      onPress={onPress ? () => onPress(item) : undefined}
      style={({ pressed }) => [
        styles.card,
        { borderColor: withAlpha(rarityColor, 0.33) },
        pressed && onPress && styles.pressed,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.icon}>{TYPE_ICON[item.type] ?? '🎁'}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.rarity, { color: rarityColor }]}>{item.rarity}</Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.typeLabel}>{TYPE_LABEL[item.type] ?? TYPE_LABEL.token}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    gap: Spacing.xs,
    ...Shadow.card,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    flex: 1,
  },
  rarity: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
  },
  description: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  typeLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    opacity: 0.7,
  },
});
