import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';
import { useTrainingStore } from '../stores/useTrainingStore';
import { NutritionResult } from '../../data/services/NutritionService';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Phase = 'input' | 'result' | 'pending';

function parsePositive(text: string): number | null {
  const n = Number(text);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Body calibration + nutrition directive — Solo Leveling notification panel styling.
 * Two phases in one panel: metric entry, then the computed protein directive.
 * Reads/writes the training store directly (screens/components already do this).
 */
export function ProteinCalcModal({ visible, onClose }: Props) {
  const weightKg = useTrainingStore((s) => s.weightKg);
  const heightCm = useTrainingStore((s) => s.heightCm);
  const calculating = useTrainingStore((s) => s.calculatingNutrition);
  const updateBodyMetrics = useTrainingStore((s) => s.updateBodyMetrics);
  const calculateProtein = useTrainingStore((s) => s.calculateProtein);

  const [phase, setPhase] = useState<Phase>('input');
  const [weightText, setWeightText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [result, setResult] = useState<NutritionResult | null>(null);

  // Reset + prefill each time the modal opens.
  useEffect(() => {
    if (visible) {
      setPhase('input');
      setResult(null);
      setWeightText(weightKg != null ? String(weightKg) : '');
      setHeightText(heightCm != null ? String(heightCm) : '');
    }
  }, [visible, weightKg, heightCm]);

  const w = parsePositive(weightText);
  const h = parsePositive(heightText);
  const canSubmit = w != null && h != null;

  const handleCalculate = async () => {
    if (!canSubmit) return;
    const res = await calculateProtein(w, h);
    if (res) {
      setResult(res);
      setPhase('result');
    } else {
      setPhase('pending');
    }
  };

  const handleSaveOnly = async () => {
    if (!canSubmit) return;
    await updateBodyMetrics(w, h);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          {phase === 'input' && (
            <>
              <Text style={styles.header}>[ BODY CALIBRATION ]</Text>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Body weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weightText}
                  onChangeText={setWeightText}
                  keyboardType="numeric"
                  placeholder="70"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={heightText}
                  onChangeText={setHeightText}
                  keyboardType="numeric"
                  placeholder="170"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  !canSubmit && styles.buttonDisabled,
                  pressed && canSubmit && styles.pressed,
                ]}
                onPress={handleCalculate}
                disabled={!canSubmit || calculating}
              >
                {calculating ? (
                  <ActivityIndicator color={Colors.accent} />
                ) : (
                  <Text style={styles.buttonText}>CALCULATE</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
                onPress={handleSaveOnly}
                disabled={!canSubmit || calculating}
              >
                <Text style={styles.linkText}>SAVE ONLY</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
                onPress={onClose}
                disabled={calculating}
              >
                <Text style={styles.cancelText}>CANCEL</Text>
              </Pressable>
            </>
          )}

          {phase === 'result' && result && (
            <>
              <Text style={styles.header}>[ NUTRITION DIRECTIVE ]</Text>
              <Text style={styles.bigValue}>{result.dailyProteinG}g</Text>
              <Text style={styles.rangeLine}>
                {result.rangeMinG}–{result.rangeMaxG}g
              </Text>
              {result.bmi != null && (
                <Text style={styles.bmiLine}>
                  BMI {result.bmi} · {result.bmiCategory}
                </Text>
              )}
              <Text style={styles.body}>{result.rationale}</Text>
              <Text style={styles.body}>{result.tip}</Text>
              {!result.aiGenerated && <Text style={styles.localNote}>(local calibration)</Text>}

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>ACCEPT</Text>
              </Pressable>
            </>
          )}

          {phase === 'pending' && (
            <>
              <Text style={styles.header}>[ BODY CALIBRATION ]</Text>
              <Text style={styles.pendingTitle}>[Calibration pending.]</Text>
              <Text style={styles.body}>The formula awaits implementation.</Text>

              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>CLOSE</Text>
              </Pressable>
            </>
          )}
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
  field: {
    width: '100%',
    gap: Spacing.xs,
  },
  fieldLabel: {
    fontFamily: Fonts.pixel,
    fontSize: 8,
    letterSpacing: 1,
    color: Colors.accent,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.3),
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bigValue: {
    fontFamily: Fonts.pixel,
    fontSize: 32,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  rangeLine: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bmiLine: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 1,
  },
  body: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    lineHeight: 16,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  localNote: {
    fontFamily: Fonts.pixel,
    fontSize: 8,
    color: Colors.textSecondary,
  },
  pendingTitle: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    color: Colors.warning,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    minWidth: 160,
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
  linkButton: {
    paddingVertical: Spacing.xs,
  },
  linkText: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
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
