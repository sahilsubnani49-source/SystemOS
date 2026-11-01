import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, cancelAnimation } from 'react-native-reanimated';
import type { Prompt } from '@kotodama/core';
import { PButton, PText } from '../ui/Pixel';
import { speakJa } from '../audio/speak';
import { C, F } from '../theme';
import { PROMPT_HEADING } from '../ui/promptLabels';


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
  // What the big text is, and what the choices are, for each prompt kind.
  const displayIsJa =
    prompt.kind === 'recognize' || prompt.kind === 'type' || prompt.kind === 'mirror' || prompt.kind === 'meaning' || prompt.kind === 'reading';
  const choicesAreJa =
    prompt.kind === 'recall' ||
    prompt.kind === 'listen' ||
    prompt.kind === 'mirror' ||
    prompt.kind === 'spell' ||
    prompt.kind === 'reading' ||
    prompt.kind === 'context';
  const isSentence = prompt.kind === 'context';
  const isKanji = prompt.itemId.startsWith('j-');
  const choicesAreEnglish = prompt.kind === 'meaning';
  const longest = Math.max(1, ...prompt.choices.map((c) => [...c].length));

  return (
    <View style={styles.card} testID="prompt">
      <PText style={[styles.kind, purify && { color: C.violet }]}>{purify ? 'PURIFY: TYPE ITS TRUE NAME' : isKanji && prompt.kind === 'recall' ? 'FIND THE KANJI' : PROMPT_HEADING[prompt.kind]}</PText>
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
      ) : isSentence ? (
        // A sentence wraps at a readable size; its translation sits underneath.
        <View style={{ gap: 6 }}>
          <PText ja style={styles.sentence}>{prompt.display}</PText>
          {prompt.hint ? <PText style={styles.hint}>{prompt.hint}</PText> : null}
        </View>
      ) : (
        <View style={styles.displayRow}>
          <PText
            ja={displayIsJa}
            style={
              displayIsJa
                ? [styles.bigKana, { fontSize: jaSize(prompt.display, 64), lineHeight: jaSize(prompt.display, 64) * 1.2 }]
                : [styles.bigRomaji, prompt.display.length > 9 && { fontSize: 16, lineHeight: 26 }]
            }
          >
            {prompt.display}
          </PText>
          {prompt.kind === 'spell' ? (
            <Pressable onPress={() => speakJa(prompt.speak)} accessibilityLabel="hear the word" style={styles.speaker}>
              <PText style={styles.speakerIcon}>🔊</PText>
            </Pressable>
          ) : null}
        </View>
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
            placeholder={isKanji ? 'a reading: mizu, sui...' : 'romaji, e.g. ka'}
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
              <PText
                ja={choicesAreJa}
                style={
                  choicesAreJa
                    ? [styles.choiceKana, { fontSize: jaSize(c, 32, longest), lineHeight: jaSize(c, 32, longest) * 1.25 }]
                    : choicesAreEnglish
                      ? styles.choiceEnglish
                      : styles.choiceRomaji
                }
              >
                {c}
              </PText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Font size that keeps a Japanese string on one line: single kana stay huge,
 * インターネット shrinks. `longest` keeps all four choices the same size.
 */
function jaSize(text: string, max: number, longest = [...text].length): number {
  const n = Math.max([...text].length, longest);
  if (n <= 2) return max;
  if (n <= 4) return Math.round(max * 0.7);
  if (n <= 6) return Math.round(max * 0.5);
  return Math.round(max * 0.4);
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
  sentence: { fontSize: 24, lineHeight: 34, color: C.paper, textAlign: 'center' },
  hint: { fontSize: 7, lineHeight: 12, color: C.dim, textAlign: 'center' },
  displayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  speaker: { padding: 6, borderRadius: 6, borderWidth: 2, borderColor: C.panelEdge },
  speakerIcon: { fontSize: 18, lineHeight: 24 },
  choiceEnglish: { fontSize: 9, lineHeight: 14, color: C.paper, textAlign: 'center', paddingHorizontal: 6 },
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
