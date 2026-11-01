import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, cancelAnimation } from 'react-native-reanimated';
import type { Prompt } from '@kotodama/core';
import { PButton, PText } from '../ui/Pixel';
import { speakJa } from '../audio/speak';
import { C, F } from '../theme';

const KIND_LABEL = {
  recognize: 'READ IT',
  recall: 'FIND THE KANA',
  listen: 'LISTEN',
  type: 'TYPE THE READING',
} as const;

/** The question. Calls onAnswer(value, elapsedMs) exactly once. */
export function PromptCard({ prompt, purify, onAnswer }: { prompt: Prompt; purify: boolean; onAnswer: (value: string, elapsedMs: number) => void }) {
  const shownAt = useRef(Date.now());
  const answered = useRef(false);
  const [typed, setTyped] = useState('');
  const bar = useSharedValue(1);

  const submit = (value: string, elapsed?: number) => {
    if (answered.current) return;
    answered.current = true;
    cancelAnimation(bar);
    onAnswer(value, elapsed ?? Date.now() - shownAt.current);
  };

  useEffect(() => {
    shownAt.current = Date.now();
    answered.current = false;
    setTyped('');
    if (prompt.kind === 'listen') speakJa(prompt.speak);
    if (prompt.timeLimitMs === null) return;
    bar.value = 1;
    bar.value = withTiming(0, { duration: prompt.timeLimitMs, easing: Easing.linear });
    const limit = prompt.timeLimitMs;
    const t = setTimeout(() => submit('', limit + 1), limit + 30);
    return () => clearTimeout(t);
    // submit only reads refs; re-run per prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%`, backgroundColor: bar.value < 0.33 ? C.hpLow : C.gold }));
  const bigIsKana = prompt.kind === 'recognize' || prompt.kind === 'type';

  return (
    <View style={styles.card} testID="prompt">
      <PText style={[styles.kind, purify && { color: C.violet }]}>{purify ? 'PURIFY: TYPE ITS TRUE NAME' : KIND_LABEL[prompt.kind]}</PText>
      {prompt.timeLimitMs !== null ? (
        <View style={styles.track}>
          <Animated.View style={[styles.fill, barStyle]} />
        </View>
      ) : null}

      {prompt.kind === 'listen' ? (
        <Pressable onPress={() => speakJa(prompt.speak)} style={styles.listen} accessibilityLabel="play sound again">
          <PText style={styles.listenIcon}>🔊</PText>
          <PText style={styles.listenHint}>tap to hear again</PText>
        </Pressable>
      ) : (
        <PText ja={bigIsKana} style={bigIsKana ? styles.bigKana : styles.bigRomaji}>{prompt.display}</PText>
      )}

      {prompt.kind === 'type' ? (
        <View style={{ gap: 8 }}>
          <TextInput
            testID="type-input"
            value={typed}
            onChangeText={setTyped}
            onSubmitEditing={() => typed.trim() && submit(typed)}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="romaji, e.g. ka"
            placeholderTextColor={C.dim}
            style={styles.input}
            returnKeyType="done"
          />
          <PButton label="STRIKE" onPress={() => typed.trim() && submit(typed)} disabled={!typed.trim()} tone="violet" />
        </View>
      ) : (
        <View style={styles.choices}>
          {prompt.choices.map((c) => (
            <Pressable
              key={c}
              testID={`choice-${c}`}
              accessibilityRole="button"
              accessibilityLabel={c}
              onPress={() => submit(c)}
              style={({ pressed }) => [styles.choice, pressed && { backgroundColor: '#2E2A44' }]}
            >
              <PText ja={!bigIsKana} style={bigIsKana ? styles.choiceRomaji : styles.choiceKana}>{c}</PText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  kind: { fontSize: 8, color: C.jade, textAlign: 'center' },
  track: { height: 6, backgroundColor: '#0E0C18', borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6 },
  bigKana: { fontSize: 64, lineHeight: 76, textAlign: 'center', color: C.paper },
  bigRomaji: { fontSize: 26, lineHeight: 40, textAlign: 'center', color: C.gold, fontFamily: F.pixel },
  listen: { alignItems: 'center', paddingVertical: 8 },
  listenIcon: { fontSize: 36, lineHeight: 48 },
  listenHint: { fontSize: 7, color: C.dim },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    width: '48.5%',
    minHeight: 58,
    backgroundColor: '#15131F',
    borderColor: C.panelEdge,
    borderWidth: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceRomaji: { fontSize: 16, lineHeight: 22, color: C.paper },
  choiceKana: { fontSize: 32, lineHeight: 40, color: C.paper },
  input: {
    fontFamily: F.pixel,
    fontSize: 18,
    color: C.paper,
    borderWidth: 3,
    borderColor: C.violet,
    borderRadius: 6,
    padding: 12,
    textAlign: 'center',
    backgroundColor: '#0E0C18',
  },
});
