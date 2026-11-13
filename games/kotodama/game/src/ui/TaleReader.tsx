import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { getTale } from '@kotodama/core';
import type { TaleReading } from '../state/gameStore';
import { PButton, PText, Panel } from './Pixel';
import { speakJa } from '../audio/speak';
import { playSfx } from '../audio/music';
import { C } from '../theme';

/**
 * A folk tale, one page at a time. Nothing here is graded: the hiragana is the
 * page, the English stays folded away until asked for, and the speaker reads the
 * page aloud. Turning the last page is what marks the tale as read.
 */
export function TaleReader({ reading, onTurn, onClose }: { reading: TaleReading; onTurn: (dir: 1 | -1) => void; onClose: () => void }) {
  const tale = getTale(reading.taleId);
  const page = tale.pages[reading.page];
  const [showEnglish, setShowEnglish] = useState(false);

  // Each new page starts in Japanese only: try to read it first.
  useEffect(() => setShowEnglish(false), [reading.page, reading.taleId]);

  if (!page) return null;
  const last = reading.page === tale.pages.length - 1;

  return (
    <View style={styles.overlay} testID="tale-reader">
      <Panel style={styles.sheet}>
        <View style={styles.head}>
          <PText ja style={styles.titleJa}>{tale.titleJa}</PText>
          <PText style={styles.title}>{tale.title.toUpperCase()}</PText>
        </View>

        <ScrollView style={styles.pageBox} contentContainerStyle={styles.pageInner}>
          {/* One Text per word, so a line never breaks inside a word: the spaces are the
              only word boundaries a hiragana-only page has. */}
          <View style={styles.words}>
            {page.ja.split(/\s+/).filter(Boolean).map((word, i) => (
              <PText key={`${i}-${word}`} ja style={styles.ja}>{word}</PText>
            ))}
          </View>
          <Pressable
            testID="tale-english"
            accessibilityRole="button"
            accessibilityLabel="show the English"
            onPress={() => setShowEnglish((v) => !v)}
            style={styles.englishBox}
          >
            <PText style={[styles.english, !showEnglish && { color: C.dim }]}>{showEnglish ? page.en : 'TAP TO SHOW THE ENGLISH'}</PText>
          </Pressable>
        </ScrollView>

        <View style={styles.row}>
          <Pressable onPress={() => speakJa(page.ja)} accessibilityRole="button" accessibilityLabel="hear this page" style={styles.speaker}>
            <PText style={styles.speakerIcon}>🔊</PText>
          </Pressable>
          <PText style={styles.count}>{reading.page + 1} / {tale.pages.length}</PText>
        </View>

        <View style={styles.row}>
          <PButton testID="tale-back" label="BACK" sub="まえ" tone="dim" disabled={reading.page === 0} onPress={() => onTurn(-1)} style={styles.nav} />
          <PButton testID="tale-next" label={last ? 'THE END' : 'NEXT'} sub={last ? 'おしまい' : 'つぎ'} tone={last ? 'jade' : 'gold'} onPress={() => { if (last) playSfx('shard'); onTurn(1); }} style={styles.nav} />
        </View>
        <PButton label="PUT IT DOWN" tone="dim" onPress={onClose} />
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,5,12,0.9)', justifyContent: 'center', padding: 12 },
  sheet: { gap: 10, maxHeight: '92%', borderColor: C.paperDim },
  head: { alignItems: 'center', gap: 2 },
  titleJa: { fontSize: 24, lineHeight: 32, color: C.gold },
  title: { fontSize: 8, color: C.paperDim, textAlign: 'center' },
  pageBox: { backgroundColor: '#15131F', borderColor: C.panelEdge, borderWidth: 2, borderRadius: 6, flexGrow: 0 },
  pageInner: { padding: 14, gap: 14 },
  // Generous line height: the spaces between words are what make hiragana-only text readable.
  words: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
  ja: { fontSize: 22, lineHeight: 38, color: C.paper },
  englishBox: { borderTopWidth: 2, borderTopColor: C.panelEdge, paddingTop: 10 },
  english: { fontSize: 9, lineHeight: 16, color: C.sakura },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  speaker: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 2, borderColor: C.panelEdge },
  speakerIcon: { fontSize: 18, lineHeight: 24 },
  count: { fontSize: 9, color: C.dim },
  nav: { flex: 1 },
});
