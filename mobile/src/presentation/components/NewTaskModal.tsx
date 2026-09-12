import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Fonts, FontSize, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';

interface Props {
  visible: boolean;
  onCreate: (name: string, icon: string) => Promise<void>;
  onClose: () => void;
}

/** Emoji stand in for icons app-wide (tab bar, inventory folders) — same here. */
const ICON_CHOICES = ['💻', '📚', '🏋️', '🎨', '🎸', '🧘', '📝', '🏃', '🎮', '🔬', '🍳', '🌱'];

/** Create a new Hunter Log category: a short name and an emoji. */
export function NewTaskModal({ visible, onCreate, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <NewTaskPanel key={visible ? 'open' : 'closed'} onCreate={onCreate} onClose={onClose} />
    </Modal>
  );
}

function NewTaskPanel({ onCreate, onClose }: Omit<Props, 'visible'>) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [submitting, setSubmitting] = useState(false);

  const canCreate = name.trim().length > 0 && !submitting;

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await onCreate(name, icon);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.panel}>
        <Text style={styles.header}>[ NEW TASK ]</Text>

        <Text style={styles.label}>NAME</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Reading"
          placeholderTextColor={Colors.textSecondary}
          maxLength={24}
          autoFocus
        />

        <Text style={styles.label}>ICON</Text>
        <View style={styles.iconRow}>
          {ICON_CHOICES.map((choice) => {
            const active = icon === choice;
            return (
              <Pressable
                key={choice}
                style={({ pressed }) => [
                  styles.iconChip,
                  active && styles.iconChipActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setIcon(choice)}
              >
                <Text style={styles.iconText}>{choice}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canCreate && styles.buttonDisabled,
            pressed && canCreate && styles.pressed,
          ]}
          onPress={handleCreate}
          disabled={!canCreate}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <Text style={styles.buttonText}>CREATE</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          onPress={onClose}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>CANCEL</Text>
        </Pressable>
      </View>
    </View>
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
    gap: Spacing.sm,
    ...Shadow.glow(Colors.accent),
  },
  header: {
    fontFamily: Fonts.pixel,
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.3),
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: withAlpha(Colors.textSecondary, 0.3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipActive: {
    borderColor: Colors.primary,
    backgroundColor: withAlpha(Colors.primary, 0.15),
  },
  iconText: {
    fontSize: 20,
  },
  button: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    color: Colors.accent,
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
