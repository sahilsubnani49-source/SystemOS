import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontStyle } from './fonts';
import {
  ARC_STARTS, FOLK_SITES, HONSAI_GOAL, HONSAI_DISTRICTS, honsaiLedger, JA_FONTS, LATIN_FONTS, fontSettings, type JaFont, type LatinFont, getMap, taleReadFlag, KANJI, KANJI_GROUPS, MAX_STAGE, PARTY_SIZE, SEALS, TIMER_CHOICES_S, type ArcStart, VOLUME_STEPS, audioSettings, canReleaseSpirit, stepVolume, dueCount, SPIRIT_FAMILIES, WORDS, familyStage, getFamily, horseSpeed, kanaWhere, primaryReading, xpToNext,
  type KanaRow, type KanjiGroup, type Save, type Script, type SpiritFamily,
} from '@kotodama/core';
import { characterImage, spiritImage } from '../art/atlas';
import { SpriteView } from './Sprite';
import { PButton, PText, Panel } from './Pixel';
import { currentVoice, loadJaVoices, scoreVoice, setPreferredVoice, speakJa, type JaVoice } from '../audio/speak';
import { NEURAL_DOWNLOAD_MB, deleteNeural, downloadNeural, neuralStatus, subscribeNeural, type NeuralStatus } from '../audio/neural';
import { playSfx } from '../audio/music';
import { useGameApi } from '../state/context';
import { C } from '../theme';

type Tab = 'party' | 'kana' | 'kanji' | 'words' | 'dex' | 'system';

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
          {(['party', 'kana', 'kanji', 'words', 'dex', 'system'] as Tab[]).map((t) => (
            <Pressable key={t} onPress={() => { playSfx('menuClick'); setTab(t); }} style={[styles.tab, tab === t && styles.tabOn]}>
              <PText style={[styles.tabText, tab === t && { color: C.ink }]}>{t.toUpperCase()}</PText>
            </Pressable>
          ))}
        </View>
        <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
          {tab === 'party' && <PartyTab save={save} />}
          {tab === 'kana' && <KanaTab save={save} />}
          {tab === 'kanji' && <KanjiTab save={save} />}
          {tab === 'words' && <WordsTab save={save} />}
          {tab === 'dex' && <DexTab save={save} />}
          {tab === 'system' && (
            <View style={{ gap: 10 }}>
              <FontSection save={save} />
              <TimerSection save={save} />
              {TESTER_TOOLS ? <SkipSection onDone={onClose} /> : null}
              <SoundSection save={save} />
              <NeuralSection />
              <VoiceSection save={save} />
              <PText style={styles.dim}>
                Honsai's words: meanings, readings and verb classes from JMdict, © the Electronic Dictionary Research and Development Group, used under CC BY-SA 4.0.
              </PText>
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

const VOICE_SAMPLE = 'こんにちは。 むかし むかし、 ある ところに、 おじいさんと おばあさんが いました。';

/**
 * TESTER TOOLS: a shortcut to skip arcs already played. Set to false before shipping
 * to players.
 */
const TESTER_TOOLS = true;

function SkipSection({ onDone }: { onDone: () => void }) {
  const api = useGameApi();
  const [picked, setPicked] = useState<ArcStart | null>(null);
  return (
    <View testID="skip-section" style={[styles.spirit, { borderColor: C.violet }]}>
      <PText style={[styles.name, { color: C.violet }]}>TESTER: SKIP TO ARC</PText>
      <PText style={styles.dim}>
        For testing. Marks every earlier arc's story as done, raises your hero and team to that arc's level, and moves you to its first town. What you have learned is kept.
      </PText>
      {picked ? (
        <View style={{ gap: 6 }}>
          <PText style={[styles.dim, { color: C.gold }]}>Jump to {picked.label} at level {picked.level}? This cannot be undone.</PText>
          <View style={styles.actions}>
            <SmallButton testID="skip-yes" label="YES, JUMP" color={C.violet} onPress={() => { api.getState().skipToArc(picked); setPicked(null); onDone(); }} />
            <SmallButton testID="skip-no" label="CANCEL" color={C.paper} onPress={() => setPicked(null)} />
          </View>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {ARC_STARTS.map((s) => (
            <SmallButton key={s.arc} testID={`skip-arc-${s.arc}`} label={`${s.label.toUpperCase()} (LV ${s.level})`} color={C.violet} onPress={() => setPicked(s)} />
          ))}
        </View>
      )}
    </View>
  );
}

const timerLabel = (ms: number | null | undefined) =>
  ms === undefined ? 'STANDARD (4-6 SEC)' : ms === null ? 'NO TIMER' : `${Math.round(ms / 1000)} SECONDS`;

/** How long timed moves (the ninja's Shuriken Storm and friends) give you to answer. */
const JA_FONT_NAMES: Record<JaFont, { name: string; note: string }> = {
  pixel: { name: 'PIXEL', note: 'The game look. Dense kanji can blur.' },
  textbook: { name: 'TEXTBOOK', note: 'Drawn like a school textbook: every stroke clear.' },
  clear: { name: 'CLEAR', note: "Your phone's own Japanese font." },
};
const LATIN_FONT_NAMES: Record<LatinFont, string> = { pixel: 'PIXEL', clear: 'CLEAR' };
/** Kanji that turn to mush at pixel resolution, plus kana pairs learners mix up. */
const FONT_SAMPLE = '曜日 議論 機械 さ ち シ ツ';

/** Reading fonts: three Japanese faces, previewed in themselves, and two English ones. */
function FontSection({ save }: { save: Save }) {
  const api = useGameApi();
  const current = fontSettings(save);
  return (
    <View testID="font-section" style={styles.spirit}>
      <PText style={styles.name}>FONT</PText>
      <PText style={styles.dim}>If kanji are hard to make out, pick TEXTBOOK or CLEAR. Everything in the game switches at once.</PText>
      <PText style={styles.dim}>JAPANESE</PText>
      {JA_FONTS.map((f) => {
        const on = current.ja === f;
        return (
          <Pressable
            key={f}
            testID={`font-ja-${f}`}
            accessibilityRole="button"
            accessibilityLabel={`Japanese font: ${JA_FONT_NAMES[f].name}`}
            onPress={() => { playSfx('menuClick'); api.getState().setFont({ ja: f }); }}
            style={[styles.fontOption, on && styles.fontOptionOn]}
          >
            <View style={styles.volumeHead}>
              <PText style={[styles.smallText, { color: on ? C.gold : C.paper }]}>{JA_FONT_NAMES[f].name}</PText>
              {on ? <PText style={[styles.smallText, { color: C.gold }]}>✓</PText> : null}
            </View>
            {/* Each sample is drawn in its own face, whatever is chosen now. */}
            <Text style={[styles.fontSample, fontStyle({ ...current, ja: f }, true, styles.fontSample)]}>{FONT_SAMPLE}</Text>
            <PText style={styles.dim}>{JA_FONT_NAMES[f].note}</PText>
          </Pressable>
        );
      })}
      <PText style={styles.dim}>ENGLISH</PText>
      <View style={styles.actions}>
        {LATIN_FONTS.map((f) => {
          const on = current.latin === f;
          return (
            <Pressable
              key={f}
              testID={`font-latin-${f}`}
              accessibilityRole="button"
              onPress={() => { playSfx('menuClick'); api.getState().setFont({ latin: f }); }}
              style={[styles.small, { borderColor: on ? C.gold : C.panelEdge }]}
            >
              <Text style={[styles.smallText, { color: on ? C.gold : C.paper }, fontStyle({ ...current, latin: f }, false, styles.smallText)]}>
                {LATIN_FONT_NAMES[f]} Aa
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TimerSection({ save }: { save: Save }) {
  const api = useGameApi();
  const [open, setOpen] = useState(false);
  const choose = (ms: number | null | undefined) => {
    playSfx('menuClick');
    api.getState().setTimer(ms);
    setOpen(false);
  };
  const options: (number | null | undefined)[] = [undefined, ...TIMER_CHOICES_S.map((s) => (s === 0 ? null : s * 1000))];
  return (
    <View testID="timer-section" style={styles.spirit}>
      <PText style={styles.name}>ANSWER TIMER</PText>
      <PText style={styles.dim}>
        {save.hero === 'ninja' ? 'Your ninja moves are timed: answer fast to strike. ' : 'Some moves are timed: answer fast to strike. '}
        New to Japanese? Give yourself more time. A quick answer still lands a critical hit.
      </PText>
      <Pressable testID="timer-picker" accessibilityRole="button" onPress={() => setOpen((o) => !o)} style={styles.dropdown}>
        <PText style={styles.dropdownText}>{timerLabel(save.timerMs)}</PText>
        <PText style={styles.dropdownText}>{open ? '▲' : '▼'}</PText>
      </Pressable>
      {open ? (
        <View style={styles.dropdownList}>
          {options.map((ms) => {
            const on = ms === save.timerMs;
            return (
              <Pressable key={String(ms)} testID={`timer-${ms === undefined ? 'standard' : ms === null ? 'off' : ms / 1000}`} onPress={() => choose(ms)} style={[styles.dropdownItem, on && styles.dropdownItemOn]}>
                <PText style={[styles.dropdownText, on && { color: C.ink }]}>{timerLabel(ms)}</PText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** One volume control: a row of notches, quieter and louder, and a mute switch. */
function VolumeRow({ id, label, volume, muted, onVolume, onMute }: {
  id: string; label: string; volume: number; muted: boolean; onVolume: (v: number) => void; onMute: (m: boolean) => void;
}) {
  const notches = Math.round(volume * VOLUME_STEPS);
  return (
    <View style={{ gap: 6 }} testID={`volume-${id}`}>
      <View style={styles.volumeHead}>
        <PText style={styles.dim}>{label}</PText>
        <PText style={[styles.dim, { color: muted ? C.red : C.paper }]}>{muted ? 'MUTED' : `${notches * 10}%`}</PText>
      </View>
      <View style={styles.notches} accessibilityLabel={`${label} volume ${notches} of ${VOLUME_STEPS}`}>
        {Array.from({ length: VOLUME_STEPS }, (_, i) => (
          <View key={i} style={[styles.notch, i < notches && { backgroundColor: muted ? C.dim : C.gold }]} />
        ))}
      </View>
      <View style={styles.actions}>
        <SmallButton testID={`${id}-down`} label="-" color={C.paper} onPress={() => onVolume(stepVolume(volume, -1))} />
        <SmallButton testID={`${id}-up`} label="+" color={C.paper} onPress={() => onVolume(stepVolume(volume, 1))} />
        <SmallButton testID={`${id}-mute`} label={muted ? 'UNMUTE' : 'MUTE'} color={muted ? C.jade : C.red} onPress={() => onMute(!muted)} />
      </View>
    </View>
  );
}

/** Music and sound-effect volume. Changes are heard at once and saved with the game. */
function SoundSection({ save }: { save: Save }) {
  const api = useGameApi();
  const a = audioSettings(save);
  const set = api.getState().setAudio;
  return (
    <View testID="sound-section" style={styles.spirit}>
      <PText style={styles.name}>SOUND</PText>
      <VolumeRow id="music" label="MUSIC" volume={a.musicVolume} muted={a.musicMuted}
        // Turning the volume up from a muted state is asking to hear it again.
        onVolume={(musicVolume) => set({ musicVolume, musicMuted: false })} onMute={(musicMuted) => set({ musicMuted })} />
      <VolumeRow id="sfx" label="SOUND EFFECTS" volume={a.sfxVolume} muted={a.sfxMuted}
        onVolume={(sfxVolume) => { set({ sfxVolume, sfxMuted: false }); playSfx('correct'); }}
        onMute={(sfxMuted) => { set({ sfxMuted }); if (!sfxMuted) playSfx('correct'); }} />
      <PText style={styles.dim}>The music lowers itself while Japanese is being spoken.</PText>
    </View>
  );
}

/** The optional on-device neural voice (Kokoro): download it, try it, remove it. */
function NeuralSection() {
  const [status, setStatus] = useState<NeuralStatus>(neuralStatus);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => subscribeNeural(setStatus), []);

  return (
    <View testID="neural-section" style={styles.spirit}>
      <PText style={styles.name}>NEURAL VOICE</PText>
      {status.state === 'unsupported' ? (
        <PText style={styles.dim}>{status.reason}</PText>
      ) : status.state === 'ready' ? (
        <>
          <PText style={[styles.dim, { color: C.jade }]}>ON. Kokoro, an open model, running on this device.</PText>
          <PText style={styles.dim}>It reads hiragana and katakana lines. Lines with kanji use the device voice below. The first time a line is spoken takes a moment; after that it is instant.</PText>
          {confirming ? (
            <View style={styles.actions}>
              <SmallButton testID="neural-remove-yes" label="YES, REMOVE" color={C.red} onPress={() => { deleteNeural(); setConfirming(false); }} />
              <SmallButton label="KEEP" color={C.paper} onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <View style={styles.actions}>
              <SmallButton testID="neural-test" label="TEST" color={C.gold} onPress={() => speakJa(VOICE_SAMPLE)} />
              <SmallButton testID="neural-remove" label="REMOVE" color={C.red} onPress={() => setConfirming(true)} />
            </View>
          )}
        </>
      ) : status.state === 'downloading' ? (
        <PText style={styles.dim}>Downloading... {Math.round(status.progress * 100)}%. Keep the game open.</PText>
      ) : (
        <>
          <PText style={styles.dim}>
            A more natural voice that runs on this device, with no account and nothing sent anywhere. It is a one-time {NEURAL_DOWNLOAD_MB} MB download; use Wi-Fi.
          </PText>
          {status.state === 'error' ? <PText style={[styles.dim, { color: C.red }]}>It did not work: {status.message}</PText> : null}
          <View style={styles.actions}>
            <SmallButton testID="neural-download" label={status.state === 'error' ? 'TRY AGAIN' : `DOWNLOAD ${NEURAL_DOWNLOAD_MB} MB`} color={C.jade} onPress={() => void downloadNeural()} />
          </View>
        </>
      )}
    </View>
  );
}

/** Which of the device's Japanese voices reads the game aloud. */
function VoiceSection({ save }: { save: Save }) {
  const api = useGameApi();
  const [voices, setVoices] = useState<JaVoice[] | null>(null);
  useEffect(() => {
    let live = true;
    void loadJaVoices().then((v) => { if (live) setVoices(v); });
    return () => { live = false; };
  }, []);

  if (!voices) return null;
  if (voices.length === 0) {
    return <PText style={styles.dim}>This device has no Japanese voice, so nothing is read aloud. Add one in the device settings (text-to-speech), then reopen the game.</PText>;
  }
  const voice = voices.find((v) => v.identifier === save.voiceId) ?? currentVoice() ?? (voices[0] as JaVoice);
  const choose = (v: JaVoice) => {
    // Set it here too: the sample below is spoken before the store's change is rendered.
    setPreferredVoice(v.identifier);
    api.getState().setVoice(v.identifier);
    speakJa(VOICE_SAMPLE);
  };
  const next = voices[(voices.indexOf(voice) + 1) % voices.length] as JaVoice;
  return (
    <View testID="voice-section" style={styles.spirit}>
      <PText style={styles.name}>VOICE</PText>
      <PText ja style={styles.ja}>{voice.name}</PText>
      <PText style={styles.dim}>
        {voices.indexOf(voice) + 1} of {voices.length} Japanese voice{voices.length === 1 ? '' : 's'} on this device, best first. Tap a speaker twice to hear a line slowly.
      </PText>
      <View style={styles.actions}>
        <SmallButton testID="voice-test" label="TEST" color={C.gold} onPress={() => speakJa(VOICE_SAMPLE)} />
        {voices.length > 1 ? <SmallButton testID="voice-next" label="NEXT VOICE" color={C.paper} onPress={() => choose(next)} /> : null}
      </View>
      {scoreVoice(voice) < 60 ? (
        <PText style={styles.dim}>
          For a clearer voice, download a higher-quality Japanese voice in your device settings. iPhone: Accessibility, Spoken Content, Voices, Japanese. Android: System, Text-to-speech output, then install voice data. It will appear here.
        </PText>
      ) : null}
    </View>
  );
}

/** A compact action under a spirit: three fit on one row. */
function SmallButton({ label, color, onPress, testID }: { label: string; color: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.small, { borderColor: color }]}>
      <PText style={[styles.smallText, { color }]}>{label}</PText>
    </Pressable>
  );
}

function PartyTab({ save }: { save: Save }) {
  const api = useGameApi();
  /** The spirit chosen to trade places; the next spirit tapped completes the swap. */
  const [picked, setPicked] = useState<string | null>(null);
  /** The spirit waiting on a yes/no before it is released. */
  const [releasing, setReleasing] = useState<string | null>(null);
  const reset = () => { setPicked(null); setReleasing(null); };
  const owned = [...save.party, ...save.box];
  return (
    <>
      <View style={styles.member}>
        <SpriteView image={characterImage(save.hero, 'down', 0)} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <PText style={styles.name}>{save.playerName}</PText>
          <PText style={styles.dim}>Lv {save.heroLevel} · {save.heroXp}/{xpToNext(save.heroLevel)} XP</PText>
          <PText style={styles.dim}>Study streak: {save.streakDays} day{save.streakDays === 1 ? '' : 's'}</PText>
          {save.horse.owned ? <PText style={styles.dim}>Hayate rides at {horseSpeed(save.streakDays).toFixed(1)}x speed</PText> : null}
          {SEALS.some((s) => save.flags[s.flag]) ? (
            <PText style={styles.dim}>Seals: {SEALS.filter((s) => save.flags[s.flag]).map((s) => s.name.replace('Seal of ', '')).join(', ')} ({SEALS.filter((s) => save.flags[s.flag]).length}/{SEALS.length})</PText>
          ) : save.flags.learned_focus ? (
            <PText style={styles.dim}>The Well of Old Tales is open (Sakura Village, east of the bridge).</PText>
          ) : null}
          {save.flags.game_complete ? <PText style={styles.dim}>Daily Trial: {dueCount(save.srs, Date.now())} items due (Master Kaito, Hayate Dojo)</PText> : null}
        </View>
      </View>
      {owned.length > 0 ? (
        <PText style={styles.dim}>
          {picked
            ? 'Choose the spirit to trade places with.'
            : `TEAM spirits fight beside you (${save.party.length}/${PARTY_SIZE}). The first one acts first. RESERVE spirits wait.`}
        </PText>
      ) : null}
      {owned.map((sp, i) => {
        const fam = getFamily(sp.familyId);
        const stage = familyStage(sp.familyId, save.srs);
        const form = fam.stages[stage];
        const onTeam = i < save.party.length;
        const isPicked = picked === sp.uid;
        return (
          <View key={sp.uid} testID={`spirit-${i}`} style={[styles.spirit, isPicked && styles.spiritPicked]}>
            <View style={styles.spiritTop}>
              <SpriteView image={spiritImage(form.sprite)} size={56} />
              <View style={{ flex: 1, gap: 4 }}>
                <PText style={styles.name}>{form.name}</PText>
                <PText ja style={styles.ja}>{form.nameJa}</PText>
                <PText style={[styles.dim, { color: onTeam ? C.jade : C.dim }]}>{onTeam ? `TEAM ${i + 1}` : 'RESERVE'} · Lv {sp.level} · {fam.element} · stage {stage + 1}/3</PText>
                <PText style={styles.dim}>Evolves as you master {masteryLabel(fam)}.</PText>
              </View>
            </View>
            {releasing === sp.uid ? (
              <View style={{ gap: 6 }}>
                <PText style={[styles.dim, { color: C.red }]}>Release {form.name} for good? It will not come back.</PText>
                <View style={styles.actions}>
                  <SmallButton testID={`release-yes-${i}`} label="YES, RELEASE" color={C.red} onPress={() => { api.getState().releaseSpirit(sp.uid); reset(); }} />
                  <SmallButton testID={`release-no-${i}`} label="KEEP" color={C.paper} onPress={reset} />
                </View>
              </View>
            ) : picked ? (
              <View style={styles.actions}>
                {isPicked
                  ? <SmallButton testID={`swap-cancel-${i}`} label="CANCEL" color={C.paper} onPress={reset} />
                  : <SmallButton testID={`swap-here-${i}`} label="SWAP HERE" color={C.gold} onPress={() => { api.getState().swapSpirits(picked, sp.uid); reset(); }} />}
              </View>
            ) : (
              <View style={styles.actions}>
                {owned.length > 1 ? <SmallButton testID={`swap-${i}`} label="SWAP" color={C.gold} onPress={() => setPicked(sp.uid)} /> : null}
                {onTeam && save.party.length > 1 ? <SmallButton testID={`rest-${i}`} label="REST" color={C.paper} onPress={() => api.getState().spiritToReserve(sp.uid)} /> : null}
                {!onTeam && save.party.length < PARTY_SIZE ? <SmallButton testID={`join-${i}`} label="JOIN TEAM" color={C.jade} onPress={() => api.getState().spiritToTeam(sp.uid)} /> : null}
                {canReleaseSpirit(save) ? <SmallButton testID={`release-${i}`} label="RELEASE" color={C.red} onPress={() => setReleasing(sp.uid)} /> : null}
              </View>
            )}
          </View>
        );
      })}
      {save.party.length === 0 ? <PText style={styles.dim}>No spirits yet. Visit Master Kaito in the dojo.</PText> : null}
    </>
  );
}

/** 'n3conflict' → { level: 'N3', name: 'conflict' }; N5 groups have no prefix. */
function groupParts(group: KanjiGroup): { level: string; name: string } {
  const m = /^n([34])(.+)$/.exec(group);
  return m ? { level: `N${m[1]}`, name: m[2] as string } : { level: 'N5', name: group };
}

function masteryLabel(fam: SpiritFamily): string {
  if (fam.kanjiGroup) {
    const g = groupParts(fam.kanjiGroup);
    return `the ${g.level} ${g.name} kanji`;
  }
  return `the ${fam.script} ${fam.row === 'w' ? 'w-row & ん' : `${fam.row}-row`}`;
}

function KanjiTab({ save }: { save: Save }) {
  const met = KANJI.filter((k) => save.srs[k.id]).length;
  if (met === 0) {
    return <PText style={styles.dim}>Kanji are taught in the Castle Capital (Arc 3), reached from Frost Harbor.</PText>;
  }
  return (
    <>
      <PText style={styles.dim}>{met}/{KANJI.length} kanji met (N5, N4, N3). Colour = mastery. Tap to hear a reading.</PText>
      {KANJI_GROUPS.map((group) => (
        <View key={group} style={{ gap: 4 }}>
          <PText style={styles.groupLabel}>{`${groupParts(group).level} · ${groupParts(group).name.toUpperCase()}`}</PText>
          <View style={styles.kanjiGrid}>
            {KANJI.filter((k) => k.group === group).map((k) => {
              const stage = save.srs[k.id]?.stage ?? -1;
              return (
                <Pressable
                  key={k.id}
                  onPress={() => speakJa(primaryReading(k))}
                  style={[styles.kanjiCell, { backgroundColor: stage < 0 ? '#14121E' : STAGE_COLORS[stage] }]}
                >
                  <PText ja style={styles.kanjiChar}>{k.char}</PText>
                  <PText style={styles.kanjiMeaning}>{stage >= MAX_STAGE ? '★' : stage < 0 ? '?' : k.meanings[0]}</PText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
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

/** Arc 6: how many of Honsai's words have been taken back from Wapul. */
function WordLedger({ save }: { save: Save }) {
  const ledger = honsaiLedger(save.srs);
  const DISTRICT_NAMES = ['Kotoba Gate', 'Ichiba Market', 'Ie-no-Sato', 'Kakehashi', 'Manabi Hill', 'Minato Harbour', 'Kokoro Garden', 'Kaze Valley', 'Matsuri Town', 'Kotonoha Court', 'Kawaraban Row', 'Tower of Silence', 'Great Library'];
  return (
    <View testID="word-ledger" style={styles.ledger}>
      <PText style={styles.name}>WORD LEDGER · ことばの ちょう</PText>
      <PText style={styles.dim}>Words restored from Wapul: remembered for a full day in review. Met: asked at least once.</PText>
      <View style={styles.volumeHead}>
        <PText style={[styles.smallText, { color: C.gold }]}>{ledger.restored} RESTORED</PText>
        <PText style={styles.smallText}>{ledger.met} met of {ledger.total} so far</PText>
      </View>
      <View style={styles.ledgerBar}>
        <View style={[styles.ledgerFill, { width: `${Math.min(100, (ledger.restored / HONSAI_GOAL) * 100)}%` }]} />
      </View>
      <PText style={styles.dim}>Goal: {HONSAI_GOAL}+ words across {HONSAI_DISTRICTS} districts.</PText>
      {ledger.districts.map((d) => (
        <View key={d.district} style={styles.volumeHead}>
          <PText style={styles.smallText}>{d.district}. {DISTRICT_NAMES[d.district - 1] ?? `District ${d.district}`}</PText>
          <PText style={[styles.smallText, { color: d.restored === d.total ? C.jade : C.paper }]}>{d.restored} / {d.total}</PText>
        </View>
      ))}
    </View>
  );
}

function WordsTab({ save }: { save: Save }) {
  const seen = WORDS.filter((w) => save.srs[w.id]);
  const vocab = seen.filter((w) => w.kind === 'vocab').length;
  const ledger = save.flags.honsai_open ? <WordLedger save={save} /> : null;
  if (seen.length === 0) {
    return (
      <>
        {ledger}
        <PText style={styles.dim}>Loanwords are taught in the Rune Watchtower of Frost Harbor (Arc 2).</PText>
      </>
    );
  }
  return (
    <>
      {ledger}
      <PText style={styles.dim}>
        {seen.length}/{WORDS.length} words met ({vocab} kanji words). Colour = mastery. Tap to hear it.
      </PText>
      {seen.map((w) => {
        const stage = save.srs[w.id]?.stage ?? 0;
        return (
          <Pressable key={w.id} onPress={() => speakJa(w.text)} style={[styles.wordRow, { borderLeftColor: STAGE_COLORS[stage] }]}>
            <View>
              <PText ja style={styles.wordJa}>{w.text}</PText>
              {w.kind === 'vocab' ? <PText ja style={styles.wordReading}>{w.reading}</PText> : null}
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <PText style={styles.wordMeaning}>{w.meaning}</PText>
              <PText style={styles.dim}>{w.romaji}{w.kind === 'loanword' ? ` · from ${w.from}` : ''}{stage >= MAX_STAGE ? ' · ★' : ''}</PText>
            </View>
          </Pressable>
        );
      })}
    </>
  );
}

function DexTab({ save }: { save: Save }) {
  return (
    <>
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
      <Storybook save={save} />
    </>
  );
}

/** Every folk tale and the map its signpost stands on; read ones are ticked. */
function Storybook({ save }: { save: Save }) {
  const read = FOLK_SITES.filter((s) => save.flags[taleReadFlag(s.tale.id)]).length;
  return (
    <View style={styles.storybook}>
      <PText style={styles.name}>FOLK TALES · {read} / {FOLK_SITES.length} READ</PText>
      <PText style={styles.dim}>Look for wooden signposts. Each leads to a tale's place, its people and its board.</PText>
      {FOLK_SITES.map((s) => {
        const done = !!save.flags[taleReadFlag(s.tale.id)];
        return (
          <View key={s.tale.id} style={styles.taleRow}>
            <PText style={[styles.smallText, { color: done ? C.jade : C.dim, width: 14 }]}>{done ? '✓' : '·'}</PText>
            <View style={{ flex: 1 }}>
              <PText ja style={[styles.taleJa, !done && { color: C.paperDim }]}>{s.tale.titleJa}</PText>
              <PText style={styles.dim}>{s.tale.title} · {getMap(s.host).def.name}</PText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  storybook: { marginTop: 14, gap: 6 },
  ledger: { gap: 6, borderWidth: 2, borderColor: C.gold, borderRadius: 4, padding: 10, marginBottom: 12 },
  ledgerBar: { height: 10, borderRadius: 3, backgroundColor: '#2A2740', overflow: 'hidden' },
  ledgerFill: { height: 10, backgroundColor: C.gold },
  fontOption: { borderWidth: 2, borderColor: C.panelEdge, borderRadius: 4, padding: 8, gap: 4 },
  fontOptionOn: { borderColor: C.gold, backgroundColor: '#1E1A30' },
  fontSample: { color: C.paper, fontSize: 20, lineHeight: 28 },
  taleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#2A2740' },
  taleJa: { fontSize: 14, lineHeight: 20, color: C.paper },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,4,12,0.72)', justifyContent: 'center', padding: 12 },
  sheet: { maxHeight: '92%' },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 4, borderWidth: 2, borderColor: C.panelEdge, alignItems: 'center' },
  tabOn: { backgroundColor: C.gold, borderColor: C.gold },
  tabText: { fontSize: 7 },
  member: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#15131F', padding: 8, borderRadius: 4 },
  spirit: { backgroundColor: '#15131F', padding: 8, borderRadius: 4, gap: 8, borderWidth: 2, borderColor: 'transparent' },
  spiritPicked: { borderColor: C.gold },
  spiritTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 6 },
  volumeHead: { flexDirection: 'row', justifyContent: 'space-between' },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2, borderColor: C.gold, borderRadius: 4, paddingHorizontal: 12, minHeight: 44 },
  dropdownText: { fontSize: 9, color: C.gold },
  dropdownList: { borderWidth: 2, borderColor: C.panelEdge, borderRadius: 4 },
  dropdownItem: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownItemOn: { backgroundColor: C.gold },
  notches: { flexDirection: 'row', gap: 3 },
  notch: { flex: 1, height: 8, borderRadius: 2, backgroundColor: '#2A2740' },
  small: { flex: 1, minHeight: 40, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  smallText: { fontSize: 7, lineHeight: 12, textAlign: 'center' },
  name: { fontSize: 9, color: C.gold },
  ja: { fontSize: 14, lineHeight: 18, color: C.sakura },
  dim: { fontSize: 7, lineHeight: 12, color: C.dim },
  kanaRow: { flexDirection: 'row', gap: 4 },
  kanaCell: { width: 52, height: 48, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E2A44' },
  kanaChar: { fontSize: 20, lineHeight: 24 },
  kanaRomaji: { fontSize: 6, color: C.paperDim },
  scriptLabel: { fontSize: 13, lineHeight: 18 },
  groupLabel: { fontSize: 7, color: C.gold, marginTop: 6 },
  kanjiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  kanjiCell: { width: 52, height: 54, borderRadius: 4, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2E2A44' },
  kanjiChar: { fontSize: 22, lineHeight: 28 },
  kanjiMeaning: { fontSize: 5, color: C.paperDim, textAlign: 'center' },
  wordReading: { fontSize: 11, lineHeight: 14, color: C.sakura },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#15131F', padding: 8, borderRadius: 4, borderLeftWidth: 5 },
  wordJa: { fontSize: 18, lineHeight: 24, color: C.paper },
  wordMeaning: { fontSize: 8, color: C.gold },
  dexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  dexCell: { width: '30%', alignItems: 'center', backgroundColor: '#15131F', paddingVertical: 8, borderRadius: 4, gap: 2 },
  dexName: { fontSize: 6, textAlign: 'center' },
});
