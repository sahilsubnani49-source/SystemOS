import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOutUp, ZoomIn, useSharedValue, withSequence, withTiming, useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { BlendColor, Canvas, Circle, Group, Image, LinearGradient, Oval, Rect, useClock, vec } from '@shopify/react-native-skia';
import {
  canPurify, getKana, getMap, getMove,
  type BattleEvent, type BattleState, type Combatant,
} from '@kotodama/core';
import { spriteImage } from '../art/atlas';
import { PIXEL_SAMPLING } from '../ui/Sprite';
import { BattleFx, FX_MS, type FxShot } from '../fx/BattleFx';
import { PromptCard } from './PromptCard';
import { PButton, PText, Panel } from '../ui/Pixel';
import { useGame, useGameApi } from '../state/context';
import type { BattleContext } from '../state/gameStore';
import { speakJa } from '../audio/speak';
import { bump } from '../audio/haptics';
import { C, hpColor } from '../theme';
import { PROMPT_TAG } from '../ui/promptLabels';

const SKY: Record<string, [string, string]> = {
  dojo: ['#2A3A6A', '#C8848A'],
  bamboo: ['#1E3A2A', '#5A8A4A'],
  river: ['#1E3A6A', '#5AA0C8'],
  hideout: ['#0E0C18', '#3A2A4A'],
  pass: ['#3A2A5A', '#C88A6A'],
  shrine: ['#1A1440', '#8A4A8A'],
  gate: ['#1A0A10', '#7A1E2E'],
};

interface Popup {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  big?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function BattleScreen() {
  const api = useGameApi();
  const ctx = useGame((s) => s.battle);
  const save = useGame((s) => s.save);
  const { width, height } = useWindowDimensions();
  // Tall phones get a taller stage instead of dead space under the command panel.
  const sceneH = Math.round(Math.min(height * 0.5, width * 1.15));

  const [playing, setPlaying] = useState(false);
  // The screen mounts once per battle, so the starting HP is read exactly once.
  const [hp, setHp] = useState<Record<string, number>>(() =>
    ctx ? Object.fromEntries([...ctx.state.party, ...ctx.state.enemies].map((c) => [c.uid, c.hp])) : {},
  );
  const [shot, setShot] = useState<FxShot | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string; sub?: string } | null>(null);
  const [fainted, setFainted] = useState<Record<string, boolean>>({});
  const seq = useRef(0);
  const shake = useSharedValue(0);
  const lastEvents = useRef<BattleEvent[] | null>(null);

  const state = ctx?.state;

  // Fixed stage positions for each combatant (scene-relative).
  const layout = useMemo(() => {
    const pos: Record<string, { x: number; y: number; size: number }> = {};
    if (!state) return pos;
    state.enemies.forEach((e, i) => {
      pos[e.uid] = { x: width * (0.72 - i * 0.18), y: sceneH * 0.36, size: width * (state.isBoss ? 0.36 : 0.3) };
    });
    const spots = [
      { x: 0.3, y: 0.74, s: 0.3 },
      { x: 0.1, y: 0.58, s: 0.2 },
      { x: 0.52, y: 0.86, s: 0.2 },
    ];
    state.party.forEach((p, i) => {
      const s = spots[i] ?? spots[0]!;
      pos[p.uid] = { x: width * s.x, y: sceneH * s.y, size: width * s.s };
    });
    return pos;
  }, [state, width, sceneH]);

  // Play each reducer step's events in order; input is locked while they play.
  useEffect(() => {
    if (!state || state.events === lastEvents.current) return;
    lastEvents.current = state.events;
    const events = state.events;
    if (events.length === 0) return;
    const run = ++seq.current;
    const alive = () => run === seq.current;
    const pop = (p: Omit<Popup, 'id'>) => {
      const id = Math.random();
      setPopups((list) => [...list, { ...p, id }]);
      setTimeout(() => setPopups((list) => list.filter((x) => x.id !== id)), 1100);
    };
    const at = (uid: string) => layout[uid] ?? { x: width / 2, y: sceneH / 2, size: 80 };

    (async () => {
      setPlaying(true);
      for (const ev of events) {
        if (!alive()) return;
        switch (ev.type) {
          case 'prompt':
            setVerdict(null);
            break;
          case 'graded': {
            const kana = getKana(ev.itemId);
            const ok = ev.grade === 'correct';
            speakJa(kana.char);
            bump(ok ? 'success' : 'error');
            setVerdict({
              ok,
              text: ok ? '正解!' : ev.grade === 'timeout' ? 'TOO SLOW' : 'MISSED',
              sub: ok ? `${kana.char} = ${kana.romaji}` : `${kana.char} is "${kana.romaji}"`,
            });
            await sleep(ok ? 650 : 1500);
            setVerdict(null);
            break;
          }
          case 'combo':
            pop({ text: `${ev.count} COMBO!`, x: width / 2, y: sceneH * 0.12, color: C.gold, big: true });
            break;
          case 'fx': {
            const from = at(ev.from);
            const to = at(ev.to);
            setShot({ id: Math.random(), kind: ev.fx, from: { x: from.x, y: from.y }, to: { x: to.x, y: to.y } });
            await sleep(FX_MS * 0.8);
            break;
          }
          case 'damage': {
            const p = at(ev.target);
            setHp((h) => ({ ...h, [ev.target]: Math.max(0, (h[ev.target] ?? 0) - ev.amount) }));
            const color = ev.crit ? C.gold : ev.effective === 'super' ? C.sakura : C.white;
            const label = `${ev.amount}${ev.crit ? ' CRIT!' : ''}${ev.effective === 'super' ? ' ▲' : ev.effective === 'weak' ? ' ▼' : ''}`;
            pop({ text: label, x: p.x, y: p.y - p.size * 0.6, color, big: ev.crit });
            shake.value = withSequence(withTiming(ev.crit ? 12 : 6, { duration: 40 }), withTiming(-6, { duration: 60 }), withTiming(0, { duration: 80 }));
            bump(ev.crit ? 'heavy' : 'light');
            await sleep(380);
            break;
          }
          case 'heal': {
            const p = at(ev.target);
            setHp((h) => ({ ...h, [ev.target]: (h[ev.target] ?? 0) + ev.amount }));
            pop({ text: `+${ev.amount}`, x: p.x, y: p.y - p.size * 0.6, color: C.hpHigh });
            await sleep(350);
            break;
          }
          case 'miss':
            pop({ text: 'MISS', x: at(ev.to).x, y: at(ev.to).y - 40, color: C.dim });
            await sleep(300);
            break;
          case 'evaded':
            pop({ text: 'DODGED', x: at(ev.target).x, y: at(ev.target).y - 40, color: C.sky });
            await sleep(350);
            break;
          case 'guarded':
            pop({ text: 'GUARD', x: at(ev.target).x, y: at(ev.target).y - 60, color: C.sky });
            break;
          case 'buff':
            pop({ text: ev.buff === 'guard' ? 'STANCE UP' : 'VANISHED', x: at(ev.target).x, y: at(ev.target).y - 40, color: C.sky });
            await sleep(350);
            break;
          case 'faint':
            setFainted((f) => ({ ...f, [ev.target]: true }));
            await sleep(420);
            break;
          case 'spared':
            pop({ text: 'IT CLINGS ON! PURIFY IT?', x: width / 2, y: sceneH * 0.18, color: C.violet, big: true });
            await sleep(700);
            break;
          case 'purify':
            pop({ text: '浄化! PURIFIED', x: width / 2, y: sceneH * 0.2, color: C.violet, big: true });
            await sleep(900);
            break;
          case 'purifyFail':
            pop({ text: 'THE SEAL HOLDS', x: width / 2, y: sceneH * 0.2, color: C.dim });
            await sleep(500);
            break;
          case 'flee':
            pop({ text: ev.success ? 'GOT AWAY' : "CAN'T ESCAPE", x: width / 2, y: sceneH * 0.5, color: C.paper });
            await sleep(600);
            break;
          case 'end':
            await sleep(250);
            break;
        }
      }
      if (alive()) setPlaying(false);
    })();
  }, [state, layout, width, sceneH, shake]);

  const sceneTransform = useDerivedValue(() => [{ translateX: shake.value }]);
  const clock = useClock();
  const bob = useDerivedValue<number>(() => Math.sin(clock.value / 300) * 3);
  const glitch = useDerivedValue<number>(() => (Math.floor(clock.value / 90) % 7 === 0 ? 4 : 0));

  if (!ctx || !state || !save) return null;
  const area = getMap(save.mapId).def.area;
  const sky = SKY[area] ?? SKY.dojo!;
  const foe = state.enemies[0] as Combatant;
  const actor = state.party[state.actor];
  const showResult = !!ctx.result && !playing;
  const choosing = state.phase === 'choose' && !playing && !ctx.result;
  const answering = state.phase === 'answer' && !playing && !!state.prompt;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: sky[0] }} />
      <View style={{ height: sceneH }}>
        <Canvas style={{ width, height: sceneH }}>
          <Group transform={sceneTransform}>
            <Rect x={0} y={0} width={width} height={sceneH}>
              <LinearGradient start={vec(0, 0)} end={vec(0, sceneH)} colors={[sky[0], sky[1]]} />
            </Rect>
            <Rect x={0} y={sceneH * 0.62} width={width} height={sceneH * 0.38} color="rgba(0,0,0,0.25)" />
            {state.enemies.map((e) => (
              <Oval key={`s${e.uid}`} x={layout[e.uid]!.x - layout[e.uid]!.size * 0.55} y={layout[e.uid]!.y + layout[e.uid]!.size * 0.38} width={layout[e.uid]!.size * 1.1} height={layout[e.uid]!.size * 0.24} color="rgba(0,0,0,0.35)" />
            ))}
            {state.party.map((p) => (
              <Oval key={`s${p.uid}`} x={layout[p.uid]!.x - layout[p.uid]!.size * 0.5} y={layout[p.uid]!.y + layout[p.uid]!.size * 0.38} width={layout[p.uid]!.size} height={layout[p.uid]!.size * 0.22} color="rgba(0,0,0,0.35)" />
            ))}
            {state.enemies.map((e) => (
              <FoeSprite key={e.uid} c={e} pos={layout[e.uid]!} bob={bob} glitch={glitch} fainted={!!fainted[e.uid]} />
            ))}
            {state.party.map((p) => (
              <PartySprite key={p.uid} c={p} pos={layout[p.uid]!} fainted={!!fainted[p.uid]} />
            ))}
            {shot ? <BattleFx key={shot.id} shot={shot} /> : null}
          </Group>
        </Canvas>

        {/* Foe HP + its true kana (the purification target) */}
        <View style={[styles.hpPanel, { left: 10, top: 10 }]}>
          <PText style={styles.hpName}>{foe.name}</PText>
          <PText ja style={styles.hpJa}>{foe.nameJa}  Lv{foe.level}</PText>
          <HpBar value={hp[foe.uid] ?? foe.hp} max={foe.maxHp} />
        </View>
        {foe.trueKana && !state.isBoss && !fainted[foe.uid] ? (
          <Animated.View entering={ZoomIn} style={[styles.seal, { left: layout[foe.uid]!.x - 26, top: layout[foe.uid]!.y - layout[foe.uid]!.size * 0.78 }]}>
            <PText ja style={styles.sealKana}>{getKana(foe.trueKana).char}</PText>
          </Animated.View>
        ) : null}
        <View style={[styles.hpPanel, { right: 10, bottom: 10, minWidth: width * 0.46 }]}>
          {state.party.map((p) => (
            <View key={p.uid} style={{ marginBottom: 4 }}>
              <PText style={[styles.hpName, p.uid === actor?.uid && choosing && { color: C.gold }]}>
                {p.uid === actor?.uid && choosing ? '▶ ' : ''}{p.name} Lv{p.level}
              </PText>
              <HpBar value={hp[p.uid] ?? p.hp} max={p.maxHp} small />
            </View>
          ))}
        </View>

        {popups.map((p) => (
          <Animated.View key={p.id} entering={FadeIn.duration(120)} exiting={FadeOutUp.duration(500)} style={[styles.popup, { left: p.x - 90, top: p.y }]} pointerEvents="none">
            <PText style={[styles.popupText, { color: p.color }, p.big && { fontSize: 16 }]}>{p.text}</PText>
          </Animated.View>
        ))}
        {verdict ? (
          <Animated.View entering={ZoomIn.duration(160)} style={[styles.verdict, { borderColor: verdict.ok ? C.jade : C.red }]} pointerEvents="none">
            <PText ja style={[styles.verdictText, { color: verdict.ok ? C.jade : C.hpLow }]}>{verdict.text}</PText>
            {verdict.sub ? <PText ja style={styles.verdictSub}>{verdict.sub}</PText> : null}
          </Animated.View>
        ) : null}
      </View>

      <View style={styles.panelArea}>
        <Panel style={styles.command}>
          {showResult && ctx.result ? (
            <ResultCard result={ctx.result} onContinue={() => api.getState().closeBattle()} />
          ) : answering && state.prompt ? (
            <PromptCard
              key={`${state.turn}-${state.answers.length}`}
              prompt={state.prompt}
              purify={state.pendingMove === 'purify'}
              onAnswer={(value, elapsedMs) => api.getState().battleAction({ type: 'answer', value, elapsedMs, now: Date.now() })}
            />
          ) : choosing && actor ? (
            <MoveMenu state={state} actor={actor} />
          ) : (
            <PText style={styles.waiting}>{ctx.title.toUpperCase()}</PText>
          )}
        </Panel>
      </View>
    </View>
  );
}

function FoeSprite({ c, pos, bob, glitch, fainted }: { c: Combatant; pos: { x: number; y: number; size: number }; bob: SharedValue<number>; glitch: SharedValue<number>; fainted: boolean }) {
  const img = spriteImage(c.sprite, 'left', 0);
  const y = useDerivedValue(() => pos.y - pos.size / 2 + bob.value);
  const gx1 = useDerivedValue(() => pos.x - pos.size / 2 - glitch.value);
  const gx2 = useDerivedValue(() => pos.x - pos.size / 2 + glitch.value);
  const corrupted = !!c.familyId; // wild Mojibake flicker; named foes stand firm
  return (
    <Group opacity={fainted ? 0.12 : 1}>
      {corrupted ? (
        <>
          <Image image={img} x={gx1} y={y} width={pos.size} height={pos.size} sampling={PIXEL_SAMPLING} opacity={0.55}>
            <BlendColor color="#FF2A6A" mode="srcIn" />
          </Image>
          <Image image={img} x={gx2} y={y} width={pos.size} height={pos.size} sampling={PIXEL_SAMPLING} opacity={0.55}>
            <BlendColor color="#2AE8FF" mode="srcIn" />
          </Image>
        </>
      ) : (
        <Circle cx={pos.x} cy={pos.y} r={pos.size * 0.55} color="rgba(200,40,60,0.18)" />
      )}
      <Image image={img} x={pos.x - pos.size / 2} y={y} width={pos.size} height={pos.size} sampling={PIXEL_SAMPLING} />
    </Group>
  );
}

function PartySprite({ c, pos, fainted }: { c: Combatant; pos: { x: number; y: number; size: number }; fainted: boolean }) {
  const img = spriteImage(c.sprite, 'right', 0);
  return (
    <Image image={img} x={pos.x - pos.size / 2} y={pos.y - pos.size / 2} width={pos.size} height={pos.size} sampling={PIXEL_SAMPLING} opacity={fainted ? 0.2 : 1} />
  );
}

function HpBar({ value, max, small }: { value: number; max: number; small?: boolean }) {
  const f = Math.max(0, Math.min(1, value / max));
  return (
    <View style={{ gap: 2 }}>
      <View style={[styles.hpTrack, small && { height: 6 }]}>
        <View style={{ width: `${f * 100}%`, height: '100%', backgroundColor: hpColor(f) }} />
      </View>
      {!small ? <PText style={styles.hpNum}>{Math.ceil(value)}/{max}</PText> : null}
    </View>
  );
}


function MoveMenu({ state, actor }: { state: BattleState; actor: Combatant }) {
  const api = useGameApi();
  const purifiable = canPurify(state);
  return (
    <View style={{ gap: 8 }}>
      <PText style={styles.menuHead}>What will {actor.name} do?</PText>
      <View style={styles.moveGrid}>
        {actor.moves.map((id) => {
          const m = getMove(id);
          return (
            <PButton
              key={id}
              testID={`move-${id}`}
              label={m.name.toUpperCase()}
              sub={`${m.nameJa} · ${PROMPT_TAG[m.prompt]}${m.timeLimitMs ? ' ⏱' : ''}`}
              tone={m.self ? 'jade' : 'gold'}
              style={styles.moveBtn}
              onPress={() => api.getState().battleAction({ type: 'choose', move: id, now: Date.now() })}
            />
          );
        })}
      </View>
      <View style={styles.moveGrid}>
        {purifiable ? (
          <PButton testID="purify" label="PURIFY" sub="浄化 · type its kana" tone="violet" style={styles.moveBtn} onPress={() => api.getState().battleAction({ type: 'purify' })} />
        ) : null}
        <PButton testID="flee" label="RUN" sub={state.isBoss ? 'no escape' : 'にげる'} tone="dim" disabled={state.isBoss} style={styles.moveBtn} onPress={() => api.getState().battleAction({ type: 'flee' })} />
      </View>
    </View>
  );
}

function ResultCard({ result, onContinue }: { result: NonNullable<BattleContext['result']>; onContinue: () => void }) {
  const title =
    result.outcome === 'won' ? 'VICTORY' : result.outcome === 'recruited' ? 'PURIFIED' : result.outcome === 'fled' ? 'ESCAPED' : 'DEFEATED';
  const color = result.outcome === 'lost' ? C.hpLow : result.outcome === 'recruited' ? C.violet : C.gold;
  return (
    <Animated.View entering={FadeIn} style={{ gap: 8, alignItems: 'center' }}>
      <PText style={[styles.resultTitle, { color }]}>{title}</PText>
      {result.recruited ? <PText style={styles.resultLine}>{result.recruited} joined your party!</PText> : null}
      {result.xp > 0 ? <PText style={styles.resultLine}>+{result.xp} XP</PText> : null}
      {result.levelUps.map((l) => (
        <PText key={l} style={[styles.resultLine, { color: C.gold }]}>{l}</PText>
      ))}
      {result.outcome === 'lost' ? <PText style={styles.resultLine}>Every miss is now due for review. Come back stronger.</PText> : null}
      <PButton testID="continue-battle" label="CONTINUE" onPress={onContinue} style={{ alignSelf: 'stretch', marginTop: 4 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  hpPanel: {
    position: 'absolute',
    backgroundColor: 'rgba(16,14,28,0.88)',
    borderColor: C.panelEdge,
    borderWidth: 2,
    borderRadius: 6,
    padding: 8,
    minWidth: 170,
  },
  hpName: { fontSize: 8, color: C.paper },
  hpJa: { fontSize: 13, lineHeight: 18, color: C.sakura },
  hpTrack: { height: 9, backgroundColor: '#0E0C18', borderRadius: 3, overflow: 'hidden', marginTop: 3 },
  hpNum: { fontSize: 7, color: C.dim, textAlign: 'right' },
  seal: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: C.violet,
    backgroundColor: 'rgba(30,20,60,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealKana: { fontSize: 30, lineHeight: 38, color: '#E6DAFF' },
  popup: { position: 'absolute', width: 180, alignItems: 'center' },
  popupText: { fontSize: 12, textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 },
  verdict: {
    position: 'absolute',
    alignSelf: 'center',
    top: '34%',
    backgroundColor: 'rgba(12,10,22,0.92)',
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    alignItems: 'center',
  },
  verdictText: { fontSize: 28, lineHeight: 36 },
  verdictSub: { fontSize: 18, lineHeight: 24, color: C.paper },
  panelArea: { flex: 1, padding: 10, justifyContent: 'flex-start' },
  command: { gap: 8 },
  waiting: { fontSize: 9, color: C.dim, textAlign: 'center', paddingVertical: 20 },
  menuHead: { fontSize: 9, color: C.paperDim },
  moveGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moveBtn: { flexGrow: 1, flexBasis: '45%' },
  resultTitle: { fontSize: 20, lineHeight: 28 },
  resultLine: { fontSize: 9, lineHeight: 14, textAlign: 'center' },
});
