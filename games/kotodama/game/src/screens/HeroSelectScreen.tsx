import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HEROES, getMove, type HeroClass } from '@kotodama/core';
import { characterImage } from '../art/atlas';
import { SpriteView } from '../ui/Sprite';
import { PButton, PText, Panel } from '../ui/Pixel';
import { useGameApi } from '../state/context';
import { C, F } from '../theme';

const PROMPT_LABEL = { recognize: 'READ', recall: 'RECALL', listen: 'LISTEN', type: 'TYPE' } as const;

function StatBar({ label, value, max = 16 }: { label: string; value: number; max?: number }) {
  return (
    <View style={styles.statRow}>
      <PText style={styles.statLabel}>{label}</PText>
      <View style={styles.statTrack}>
        <View style={[styles.statFill, { width: `${Math.min(1, value / max) * 100}%` }]} />
      </View>
    </View>
  );
}

export function HeroSelectScreen() {
  const api = useGameApi();
  const [hero, setHero] = useState<HeroClass>('samurai');
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <PText style={styles.heading}>CHOOSE YOUR PATH</PText>
        <View style={styles.cards}>
          {(Object.keys(HEROES) as HeroClass[]).map((id) => {
            const h = HEROES[id];
            const active = id === hero;
            return (
              <Pressable key={id} testID={`hero-${id}`} onPress={() => setHero(id)} style={{ flex: 1 }}>
                <Panel style={[styles.card, active && { borderColor: C.gold }]}>
                  <PText ja style={styles.cardJa}>{h.titleJa}</PText>
                  <SpriteView image={characterImage(h.sprite, 'down', 0)} size={88} />
                  <PText style={[styles.cardTitle, active && { color: C.gold }]}>{h.title.toUpperCase()}</PText>
                  <StatBar label="HP" value={h.base.hp} max={64} />
                  <StatBar label="ATK" value={h.base.atk} />
                  <StatBar label="DEF" value={h.base.def} />
                  <StatBar label="SPD" value={h.base.spd} />
                </Panel>
              </Pressable>
            );
          })}
        </View>

        <Panel>
          <PText style={styles.pitch}>{HEROES[hero].pitch}</PText>
          {HEROES[hero].moves.map((m) => {
            const move = getMove(m);
            return (
              <View key={m} style={styles.moveRow}>
                <PText ja style={styles.moveJa}>{move.nameJa}</PText>
                <PText style={styles.moveName}>{move.name}</PText>
                <PText style={styles.moveKind}>{PROMPT_LABEL[move.prompt]}</PText>
              </View>
            );
          })}
        </Panel>

        <Panel>
          <PText style={styles.label}>YOUR NAME</PText>
          <TextInput
            testID="name-input"
            value={name}
            onChangeText={setName}
            placeholder="Ren"
            placeholderTextColor={C.dim}
            maxLength={12}
            autoCorrect={false}
            style={styles.input}
          />
        </Panel>

        <PButton testID="begin" label="BEGIN" sub="はじめる" onPress={() => void api.getState().startNewGame(hero, name || 'Ren')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.night },
  scroll: { padding: 16, gap: 14 },
  heading: { color: C.gold, fontSize: 14, textAlign: 'center', marginVertical: 6 },
  cards: { flexDirection: 'row', gap: 12 },
  card: { alignItems: 'center', gap: 6 },
  cardJa: { fontSize: 28, lineHeight: 34, color: C.sakura },
  cardTitle: { fontSize: 11, marginBottom: 6 },
  statRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 6 },
  statLabel: { fontSize: 7, width: 30 },
  statTrack: { flex: 1, height: 6, backgroundColor: '#0E0C18', borderRadius: 2, overflow: 'hidden' },
  statFill: { height: 6, backgroundColor: C.gold },
  pitch: { fontSize: 9, lineHeight: 15, marginBottom: 8 },
  moveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  moveJa: { width: 72, fontSize: 15, color: C.sakura },
  moveName: { flex: 1, fontSize: 8 },
  moveKind: { fontSize: 7, color: C.jade },
  label: { fontSize: 9, color: C.dim, marginBottom: 8 },
  input: {
    fontFamily: F.pixel,
    fontSize: 14,
    color: C.paper,
    borderWidth: 2,
    borderColor: C.panelEdge,
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#0E0C18',
  },
});
