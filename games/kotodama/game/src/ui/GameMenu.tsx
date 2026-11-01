import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  MAX_STAGE, SPIRIT_FAMILIES, WORDS, familyStage, getFamily, horseSpeed, kanaWhere, xpToNext,
  type KanaRow, type Save, type Script,
} from '@kotodama/core';
import { characterImage, spiritImage } from '../art/atlas';
import { SpriteView } from './Sprite';
import { PButton, PText, Panel } from './Pixel';
import { speakJa } from '../audio/speak';
import { C } from '../theme';

type Tab = 'party' | 'kana' | 'words' | 'dex' | 'system';

const STAGE_COLORS = ['#2A2740', '#5A3A4E', '#8E4A5A', '#C8784A', '#D8B04A', '#4CD07D'];
const ROWS: KanaRow[] = ['a', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'nn'];

export function GameMenu({ save, onClose, onSave, onTitle, onExit }: {
  save: Save;
  onClose: () => void;
  onSave: () => void;
  onTitle: () => void;
  onExit?: () => void;
}) {
  const [tab, setTab] = useState<Tab>('party');
  return (
    <View style={styles.overlay}>
      <Panel style={styles.sheet}>
        <View style={styles.tabs}>
          {(['party', 'kana', 'words', 'dex', 'system'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <PText style={[styles.tabText, tab === t && { color: C.ink }]}>{t.toUpperCase()}</PText>
            </Pressable>
          ))}
        </View>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
          {tab === 'party' && <PartyTab save={save} />}
          {tab === 'kana' && <KanaTab save={save} />}
          {tab === 'words' && <WordsTab save={save} />}
          {tab === 'dex' && <DexTab save={save} />}
          {tab === 'system' && (
            <View style={{ gap: 10 }}>
              <PText style={styles.dim}>Your game saves automatically on every map change and after every battle.</PText>
              <PButton label="SAVE NOW" sub="セーブ" onPress={onSave} />
              <PButton label="TITLE SCREEN" tone="dim" onPress={onTitle} />
              {onExit ? <PButton label="LEAVE THE GATE" sub="Return to SystemOS" tone="violet" onPress={onExit} /> : null}
            </View>
          )}
        </ScrollView>
        <PButton label="CLOSE" tone="dim" onPress={onClose} style={{ marginTop: 10 }} />
      </Panel>
    </View>
  );
}

function PartyTab({ save }: { save: Save }) {
  return (
    <>
      <View style={styles.member}>
        <SpriteView image={characterImage(save.hero, 'down', 0)} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <PText style={styles.name}>{save.playerName}</PText>
          <PText style={styles.dim}>Lv {save.heroLevel} · {save.heroXp}/{xpToNext(save.heroLevel)} XP</PText>
          <PText style={styles.dim}>Study streak: {save.streakDays} day{save.streakDays === 1 ? '' : 's'}</PText>
          {save.horse.owned ? <PText style={styles.dim}>Hayate rides at {horseSpeed(save.streakDays).toFixed(1)}x speed</PText> : null}
        </View>
      </View>
      {[...save.party, ...save.box].map((sp, i) => {
        const fam = getFamily(sp.familyId);
        const stage = familyStage(sp.familyId, save.srs);
        const form = fam.stages[stage];
        return (
          <View key={sp.uid} style={styles.member}>
            <SpriteView image={spiritImage(form.sprite)} size={56} />
            <View style={{ flex: 1, gap: 4 }}>
              <PText style={styles.name}>
                {form.name} {i >= save.party.length ? '(reserve)' : ''}
              </PText>
              <PText ja style={styles.ja}>{form.nameJa}</PText>
              <PText style={styles.dim}>Lv {sp.level} · {fam.element} · stage {stage + 1}/3</PText>
              <PText style={styles.dim}>
                Evolves as you master the {fam.script} {fam.row === 'w' ? 'w-row & ん' : `${fam.row}-row`}.
              </PText>
            </View>
          </View>
        );
      })}
      {save.party.length === 0 ? <PText style={styles.dim}>No spirits yet. Visit Master Kaito in the dojo.</PText> : null}
    </>
  );
}

function KanaTab({ save }: { save: Save }) {
  // Default to katakana once the player has started learning it.
  const [script, setScript] = useState<Script>(() =>
    Object.keys(save.srs).some((id) => id.startsWith('k-')) ? 'katakana' : 'hiragana',
  );
  return (
    <>
      <View style={styles.tabs}>
        {(['hiragana', 'katakana'] as Script[]).map((sc) => (
          <Pressable key={sc} testID={`script-${sc}`} onPress={() => setScript(sc)} style={[styles.tab, script === sc && styles.tabOn]}>
            <PText ja style={[styles.scriptLabel, script === sc && { color: C.ink }]}>{sc === 'hiragana' ? 'ひらがな' : 'カタカナ'}</PText>
          </Pressable>
        ))}
      </View>
      <PText style={styles.dim}>Colour = mastery. Tap to hear it.</PText>
      {ROWS.map((row) => (
        <View key={row} style={styles.kanaRow}>
          {kanaWhere({ script, row, kind: 'basic' }).map((k) => {
            const stage = save.srs[k.id]?.stage ?? -1;
            return (
              <Pressable
                key={k.id}
                onPress={() => speakJa(k.char)}
                style={[styles.kanaCell, { backgroundColor: stage < 0 ? '#14121E' : STAGE_COLORS[stage] }]}
              >
                <PText ja style={styles.kanaChar}>{k.char}</PText>
                <PText style={styles.kanaRomaji}>{stage >= MAX_STAGE ? '★' : k.romaji}</PText>
              </Pressable>
            );
          })}
        </View>
      ))}
      <PText style={styles.dim}>
        {script === 'hiragana'
          ? 'Voiced sounds (が, ぱ) are taught at the Moon Shrine.'
          : 'Voiced katakana (ガ, パ) are taught in the Fjord Caves.'}
      </PText>
    </>
  );
}

function WordsTab({ save }: { save: Save }) {
  const seen = WORDS.filter((w) => save.srs[w.id]);
  if (seen.length === 0) {
    return <PText style={styles.dim}>Loanwords are taught in the Rune Watchtower of Frost Harbor (Arc 2).</PText>;
  }
  return (
    <>
      <PText style={styles.dim}>{seen.length}/{WORDS.length} loanwords met. Colour = mastery. Tap to hear it.</PText>
      {seen.map((w) => {
        const stage = save.srs[w.id]?.stage ?? 0;
        return (
          <Pressable key={w.id} onPress={() => speakJa(w.text)} style={[styles.wordRow, { borderLeftColor: STAGE_COLORS[stage] }]}>
            <PText ja style={styles.wordJa}>{w.text}</PText>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <PText style={styles.wordMeaning}>{w.meaning}</PText>
              <PText style={styles.dim}>{w.romaji} · from {w.from}{stage >= MAX_STAGE ? ' · ★' : ''}</PText>
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

function DexTab({ save }: { save: Save }) {
  return (
    <View style={styles.dexGrid}>
      {SPIRIT_FAMILIES.map((f) => {
        const caught = save.dex.caught.includes(f.id);
        const seen = caught || save.dex.seen.includes(f.id);
        return (
          <View key={f.id} style={styles.dexCell}>
            <View style={{ opacity: seen ? 1 : 0.15 }}>
              <SpriteView image={spiritImage(f.stages[0].sprite)} size={48} />
            </View>
            <PText style={styles.dexName}>{seen ? f.stages[0].name : '???'}</PText>
            <PText style={[styles.dexName, { color: caught ? C.jade : C.dim }]}>{caught ? 'CAUGHT' : seen ? 'SEEN' : ''}</PText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,4,12,0.72)', justifyContent: 'center', padding: 12 },
  sheet: { maxHeight: '92%' },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 4, borderWidth: 2, borderColor: C.panelEdge, alignItems: 'center' },
  tabOn: { backgroundColor: C.gold, borderColor: C.gold },
  tabText: { fontSize: 7 },
  member: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#15131F', padding: 8, borderRadius: 4 },
  name: { fontSize: 9, color: C.gold },
  ja: { fontSize: 14, lineHeight: 18, color: C.sakura },
  dim: { fontSize: 7, lineHeight: 12, color: C.dim },
  kanaRow: { flexDirection: 'row', gap: 4 },
  kanaCell: { width: 52, height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E2A44' },
  kanaChar: { fontSize: 20, lineHeight: 24 },
  kanaRomaji: { fontSize: 6, color: C.paperDim },
  scriptLabel: { fontSize: 13, lineHeight: 18 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#15131F', padding: 8, borderRadius: 4, borderLeftWidth: 5 },
  wordJa: { fontSize: 18, lineHeight: 24, color: C.paper },
  wordMeaning: { fontSize: 8, color: C.gold },
  dexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  dexCell: { width: '30%', alignItems: 'center', backgroundColor: '#15131F', paddingVertical: 8, borderRadius: 4, gap: 2 },
  dexName: { fontSize: 6, textAlign: 'center' },
});
