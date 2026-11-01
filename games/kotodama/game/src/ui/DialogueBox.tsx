import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Dialogue } from '../state/gameStore';
import { PText } from './Pixel';
import { speakJa } from '../audio/speak';
import { C } from '../theme';

const CHARS_PER_TICK = 2;

/** Typewriter dialogue: first tap completes the line, the next tap advances. */
export function DialogueBox({ dialogue, onAdvance }: { dialogue: Dialogue; onAdvance: () => void }) {
  const line = dialogue.lines[dialogue.index];
  const text = line?.text ?? '';
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(0);
    if (line?.ja) speakJa(line.ja);
    const t = setInterval(() => setShown((n) => (n >= text.length ? n : n + CHARS_PER_TICK)), 16);
    return () => clearInterval(t);
  }, [dialogue.index, dialogue.lines, text, line?.ja]);

  if (!line) return null;
  const done = shown >= text.length;
  return (
    <Pressable
      testID="dialogue"
      accessibilityRole="button"
      onPress={() => (done ? onAdvance() : setShown(text.length))}
      style={styles.wrap}
    >
      <View style={styles.box}>
        {line.speaker ? (
          <View style={styles.nameTag}>
            <PText style={styles.name}>{line.speaker}</PText>
          </View>
        ) : null}
        {line.ja ? <PText ja style={styles.ja}>{line.ja}</PText> : null}
        <PText style={styles.text}>{text.slice(0, shown)}</PText>
        {done ? <PText style={styles.more}>▼</PText> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 10, right: 10, bottom: 18 },
  box: {
    backgroundColor: 'rgba(16,14,28,0.96)',
    borderColor: C.paperDim,
    borderWidth: 3,
    borderRadius: 6,
    padding: 14,
    paddingTop: 18,
    minHeight: 120,
  },
  nameTag: {
    position: 'absolute',
    top: -14,
    left: 12,
    backgroundColor: C.crimson,
    borderColor: C.paperDim,
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  name: { fontSize: 8, color: C.paper },
  ja: { fontSize: 20, lineHeight: 28, color: C.sakura, marginBottom: 4 },
  text: { fontSize: 10, lineHeight: 17 },
  more: { position: 'absolute', right: 12, bottom: 8, color: C.gold, fontSize: 10 },
});
