import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { lessonFor, type LessonRow, type LessonSection } from '@kotodama/core';
import type { LessonOpen } from '../state/gameStore';
import { PButton, PText } from './Pixel';
import { speakJa } from '../audio/speak';
import { playSfx } from '../audio/music';
import { C } from '../theme';

// Washi paper and sumi ink: the scroll is the one light surface in the game, so it
// reads as an object the sensei hands over, not another menu.
const WASHI = '#EFE2C2';
const WASHI_EDGE = '#C9B48A';
const SUMI = '#1E1A16';
const SUMI_SOFT = '#5A4E42';
const WOOD = '#4A2E1C';
const SHU = '#B3261E'; // vermilion seal ink

/**
 * The lesson scroll (巻物): unrolled on arriving somewhere new and before a boss.
 * Every row speaks when tapped; nothing is graded. Before a boss it ends in a
 * choice: FIGHT, or step back and train more.
 */
export function LessonScroll({ open, onClose }: { open: LessonOpen; onClose: (retreat?: boolean) => void }) {
  const lesson = lessonFor(open.area);
  useEffect(() => playSfx(open.boss ? 'bossEncounter' : 'clack'), [open]);
  if (!lesson) return null;

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay} testID="lesson-scroll">
      <Animated.View entering={ZoomIn.duration(320)} style={styles.scroll}>
        <Roller />
        <View style={styles.paper}>
          <View style={styles.head}>
            <View style={styles.hanko}>
              <PText ja style={styles.hankoText}>{open.boss ? '決' : '学'}</PText>
            </View>
            <View style={{ flex: 1 }}>
              <PText style={styles.kicker}>{open.boss ? 'BEFORE THE DUEL' : 'LESSON SCROLL · まきもの'}</PText>
              <PText style={styles.title}>{open.boss ? open.boss.name.toUpperCase() : lesson.title}</PText>
              {open.boss ? <PText style={styles.subtitle}>{lesson.title}</PText> : null}
            </View>
          </View>
          <View style={styles.rule} />

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyInner}>
            {lesson.sections.map((s) => (
              <Section key={s.heading} section={s} />
            ))}
            <View style={styles.tip}>
              <PText ja style={styles.tipJa}>{lesson.tip.ja}</PText>
              <PText style={styles.tipEn}>{lesson.tip.en}</PText>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            {open.boss ? (
              <>
                <PButton testID="lesson-retreat" label="TRAIN MORE" sub="まだ" tone="dim" onPress={() => onClose(true)} style={{ flex: 1 }} />
                <PButton testID="lesson-fight" label="FIGHT ⚔" sub="しょうぶ" tone="red" onPress={() => onClose()} style={{ flex: 1 }} />
              </>
            ) : (
              <PButton testID="lesson-ready" label="I AM READY" sub="わかった" tone="gold" onPress={() => { playSfx('talk'); onClose(); }} style={{ flex: 1 }} />
            )}
          </View>
        </View>
        <Roller />
      </Animated.View>
    </Animated.View>
  );
}

function Roller() {
  return (
    <View style={styles.roller}>
      <View style={styles.knob} />
      <View style={styles.rod} />
      <View style={styles.knob} />
    </View>
  );
}

function Section({ section }: { section: LessonSection }) {
  const kanaGrid = section.rows.length > 0 && section.rows.every((r) => !r.en);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <PText ja style={styles.sectionJa}>{section.headingJa}</PText>
        <PText style={styles.sectionEn}>{section.heading}</PText>
      </View>
      {section.note ? <PText style={styles.note}>{section.note}</PText> : null}
      {kanaGrid ? (
        <View style={styles.grid}>
          {section.rows.map((r) => (
            <Pressable key={r.ja} onPress={() => speakJa(r.ja)} accessibilityRole="button" accessibilityLabel={`hear ${r.sub ?? r.ja}`} style={styles.tile}>
              <PText ja style={styles.tileJa}>{r.ja}</PText>
              <PText style={styles.tileSub}>{r.sub}</PText>
            </Pressable>
          ))}
        </View>
      ) : (
        section.rows.map((r, i) => <Row key={`${i}-${r.ja}`} row={r} />)
      )}
    </View>
  );
}

function Row({ row }: { row: LessonRow }) {
  return (
    <Pressable onPress={() => speakJa(row.ja)} accessibilityRole="button" accessibilityLabel={`hear ${row.en}`} style={styles.row}>
      <PText ja style={styles.rowJa}>{row.ja}</PText>
      <View style={styles.rowText}>
        {row.sub ? <PText ja style={styles.rowSub}>{row.sub}</PText> : null}
        <PText style={styles.rowEn}>{row.en}</PText>
      </View>
      <PText style={styles.speak}>🔊</PText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6,5,12,0.88)', justifyContent: 'center', padding: 10 },
  scroll: { maxHeight: '94%' },
  roller: { flexDirection: 'row', alignItems: 'center', height: 16, marginHorizontal: -4 },
  rod: { flex: 1, height: 12, backgroundColor: WOOD, borderColor: '#2A1A10', borderWidth: 2 },
  knob: { width: 14, height: 16, backgroundColor: C.gold, borderColor: '#7A5A20', borderWidth: 2, borderRadius: 3 },
  paper: { backgroundColor: WASHI, borderLeftWidth: 3, borderRightWidth: 3, borderColor: WASHI_EDGE, paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexShrink: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hanko: { width: 40, height: 40, borderWidth: 3, borderColor: SHU, borderRadius: 4, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  hankoText: { fontSize: 24, lineHeight: 30, color: SHU },
  kicker: { fontSize: 7, color: SHU },
  title: { fontSize: 10, lineHeight: 16, color: SUMI, marginTop: 3 },
  subtitle: { fontSize: 7, color: SUMI_SOFT, marginTop: 2 },
  rule: { height: 3, backgroundColor: SUMI, opacity: 0.8 },
  body: { flexShrink: 1 },
  bodyInner: { gap: 14, paddingBottom: 6 },
  section: { gap: 6 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8, borderBottomWidth: 1, borderBottomColor: WASHI_EDGE, paddingBottom: 2 },
  sectionJa: { fontSize: 18, lineHeight: 24, color: SUMI },
  sectionEn: { fontSize: 7, color: SHU },
  note: { fontSize: 7, lineHeight: 12, color: SUMI_SOFT },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { width: 50, alignItems: 'center', paddingVertical: 4, borderWidth: 2, borderColor: WASHI_EDGE, borderRadius: 4, backgroundColor: '#F7EDD5' },
  tileJa: { fontSize: 22, lineHeight: 28, color: SUMI },
  tileSub: { fontSize: 7, color: SUMI_SOFT },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(90,78,66,0.2)' },
  rowJa: { fontSize: 20, lineHeight: 28, color: SUMI, flexShrink: 1, maxWidth: '55%' },
  rowText: { flex: 1, gap: 2 },
  rowSub: { fontSize: 12, lineHeight: 16, color: SHU },
  rowEn: { fontSize: 7, lineHeight: 11, color: SUMI_SOFT },
  speak: { fontSize: 12, lineHeight: 16 },
  tip: { borderLeftWidth: 4, borderLeftColor: SHU, paddingLeft: 10, paddingVertical: 4, gap: 4, marginTop: 4 },
  tipJa: { fontSize: 16, lineHeight: 22, color: SUMI },
  tipEn: { fontSize: 7, lineHeight: 12, color: SUMI_SOFT },
  actions: { flexDirection: 'row', gap: 8, paddingTop: 4 },
});
