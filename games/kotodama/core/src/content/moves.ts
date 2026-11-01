import type { Element } from './elements';

/**
 * recognize: see か, choose "ka"      recall: see "ka", choose か
 * listen:    hear か, choose か        type:   see か, type "ka"
 * mirror:    see か, choose カ (or カ → か)
 * meaning:   see テレビ, choose "television"
 * spell:     see "terebi", choose テレビ among near-miss spellings
 * reading:   see 学生 (or 水), choose がくせい (or みず) among near-miss readings
 */
export type PromptKind = 'recognize' | 'recall' | 'listen' | 'type' | 'mirror' | 'meaning' | 'spell' | 'reading';

/** Visual effect the renderer plays when the move lands. */
export type FxKind =
  | 'slash' | 'heavySlash' | 'shuriken' | 'kunai' | 'smoke'
  | 'fire' | 'water' | 'wind' | 'rock' | 'lightning' | 'shadow' | 'light' | 'guard';

export interface Move {
  id: string;
  name: string;
  nameJa: string;
  prompt: PromptKind;
  power: number;
  element: Element;
  fx: FxKind;
  /** Answer window for timed prompts, ms. Null = untimed. */
  timeLimitMs: number | null;
  /** Non-damage effect applied to the user on a correct answer. */
  self?: 'guard' | 'evade' | 'heal';
  description: string;
}

const m = (move: Move) => move;

export const MOVES = {
  // ── Samurai ───────────────────────────────────────────────────────
  iai: m({ id: 'iai', name: 'Iai Draw', nameJa: '居合', prompt: 'recall', power: 1.5, element: 'steel', fx: 'heavySlash', timeLimitMs: null, description: 'A single killing draw. Recall the kana from its sound.' }),
  kesa: m({ id: 'kesa', name: 'Kesa Cut', nameJa: '袈裟斬り', prompt: 'recognize', power: 1.0, element: 'steel', fx: 'slash', timeLimitMs: null, description: 'A diagonal cut. Read the kana.' }),
  stance: m({ id: 'stance', name: 'Mountain Stance', nameJa: '山の構え', prompt: 'recognize', power: 0, element: 'earth', fx: 'guard', timeLimitMs: null, self: 'guard', description: 'Brace: the next blow against you is halved.' }),
  // ── Ninja ─────────────────────────────────────────────────────────
  shuriken: m({ id: 'shuriken', name: 'Shuriken Storm', nameJa: '手裏剣', prompt: 'recognize', power: 1.15, element: 'wind', fx: 'shuriken', timeLimitMs: 4000, description: 'Fast hands win. Answer quickly to crit.' }),
  kunai: m({ id: 'kunai', name: 'Echo Kunai', nameJa: '苦無', prompt: 'listen', power: 1.3, element: 'shadow', fx: 'kunai', timeLimitMs: 6000, description: 'Strike the shape you hear.' }),
  smoke: m({ id: 'smoke', name: 'Smoke Veil', nameJa: '煙玉', prompt: 'recognize', power: 0, element: 'shadow', fx: 'smoke', timeLimitMs: 5000, self: 'evade', description: 'Vanish: dodge the next attack.' }),
  // ── Spirit moves ──────────────────────────────────────────────────
  ember: m({ id: 'ember', name: 'Lantern Ember', nameJa: '灯火', prompt: 'recognize', power: 1.0, element: 'fire', fx: 'fire', timeLimitMs: null, description: 'A flick of lantern flame.' }),
  foxfire: m({ id: 'foxfire', name: 'Foxfire', nameJa: '狐火', prompt: 'recall', power: 1.3, element: 'fire', fx: 'fire', timeLimitMs: null, description: 'Blue flames that lure and burn.' }),
  torrent: m({ id: 'torrent', name: 'River Torrent', nameJa: '激流', prompt: 'recognize', power: 1.1, element: 'water', fx: 'water', timeLimitMs: null, description: 'The river rises.' }),
  mend: m({ id: 'mend', name: 'Spring Mend', nameJa: '湧水', prompt: 'listen', power: 0, element: 'water', fx: 'water', timeLimitMs: null, self: 'heal', description: 'Heal the user with spring water.' }),
  boulder: m({ id: 'boulder', name: 'Belly Boulder', nameJa: '腹鼓', prompt: 'recall', power: 1.2, element: 'earth', fx: 'rock', timeLimitMs: null, description: 'A drum-belly shockwave.' }),
  gale: m({ id: 'gale', name: 'Feather Gale', nameJa: '羽風', prompt: 'recognize', power: 1.0, element: 'wind', fx: 'wind', timeLimitMs: 5000, description: 'Crow-wing gusts.' }),
  thunder: m({ id: 'thunder', name: 'Raiju Bolt', nameJa: '雷撃', prompt: 'listen', power: 1.3, element: 'thunder', fx: 'lightning', timeLimitMs: null, description: 'Thunder in beast form.' }),
  nightclaw: m({ id: 'nightclaw', name: 'Night Claw', nameJa: '夜爪', prompt: 'recall', power: 1.2, element: 'shadow', fx: 'shadow', timeLimitMs: null, description: 'A cat-shadow rakes the foe.' }),
  blossom: m({ id: 'blossom', name: 'Blossom Light', nameJa: '桜光', prompt: 'recognize', power: 1.0, element: 'light', fx: 'light', timeLimitMs: null, description: 'Petals of searing light.' }),
  guardian: m({ id: 'guardian', name: 'Lion Guard', nameJa: '狛守', prompt: 'recognize', power: 0, element: 'earth', fx: 'guard', timeLimitMs: null, self: 'guard', description: 'Stone guardian stance.' }),
  tide: m({ id: 'tide', name: 'Black Tide', nameJa: '黒潮', prompt: 'type', power: 1.6, element: 'water', fx: 'water', timeLimitMs: null, description: 'Type the reading to summon the sea.' }),
  // ── Arc 2: Mirror moves (unlocked by Runa in Frost Harbor) ─────────
  twinDraw: m({ id: 'twinDraw', name: 'Twin-Script Draw', nameJa: '双字斬り', prompt: 'mirror', power: 1.35, element: 'steel', fx: 'heavySlash', timeLimitMs: null, description: 'See か, cut its twin カ. Both scripts, one blade.' }),
  mirrorKunai: m({ id: 'mirrorKunai', name: 'Mirror Kunai', nameJa: '鏡苦無', prompt: 'mirror', power: 1.1, element: 'shadow', fx: 'kunai', timeLimitMs: 4500, description: 'Throw at the reflection: find the other script, fast.' }),
  // ── Arc 2: Norse spirit moves ─────────────────────────────────────
  frostbite: m({ id: 'frostbite', name: 'Frostbite', nameJa: '凍て噛み', prompt: 'recognize', power: 1.1, element: 'water', fx: 'water', timeLimitMs: null, description: 'Fjord-cold fangs.' }),
  runebolt: m({ id: 'runebolt', name: 'Rune Bolt', nameJa: 'ルーン雷', prompt: 'mirror', power: 1.3, element: 'thunder', fx: 'lightning', timeLimitMs: null, description: 'A rune flips into its mirror and strikes.' }),
  axeCleave: m({ id: 'axeCleave', name: 'Axe Cleave', nameJa: '斧割り', prompt: 'recall', power: 1.25, element: 'steel', fx: 'heavySlash', timeLimitMs: null, description: 'A bearded axe, swung low.' }),
  berserk: m({ id: 'berserk', name: 'Berserk Flame', nameJa: '狂炎', prompt: 'spell', power: 1.5, element: 'fire', fx: 'fire', timeLimitMs: null, description: 'Spell the word right and burn bright.' }),
  // ── Arc 3: castle-town spirit moves ───────────────────────────────
  abacus: m({ id: 'abacus', name: 'Abacus Volley', nameJa: '算盤撃ち', prompt: 'recall', power: 1.2, element: 'steel', fx: 'shuriken', timeLimitMs: null, description: 'Find the kanji for the meaning; beads fly.' }),
  bellToll: m({ id: 'bellToll', name: 'Temple Bell', nameJa: '鐘鳴らし', prompt: 'reading', power: 1.25, element: 'thunder', fx: 'lightning', timeLimitMs: null, description: 'Ring true: pick the right reading.' }),
  umbrellaSpin: m({ id: 'umbrellaSpin', name: 'Umbrella Spin', nameJa: '傘回し', prompt: 'reading', power: 1.2, element: 'water', fx: 'water', timeLimitMs: null, description: 'A spinning karakasa throws rain.' }),
  inkBrush: m({ id: 'inkBrush', name: 'Ink Brush', nameJa: '墨筆', prompt: 'meaning', power: 1.15, element: 'shadow', fx: 'shadow', timeLimitMs: null, description: 'Name what the brushstroke means.' }),
  sunflare: m({ id: 'sunflare', name: 'Sun Flare', nameJa: '日炎', prompt: 'reading', power: 1.3, element: 'fire', fx: 'fire', timeLimitMs: null, description: 'Read the kanji and it burns.' }),
  // ── Enemy-only ────────────────────────────────────────────────────
  rend: m({ id: 'rend', name: 'Garbled Rend', nameJa: '文字化け', prompt: 'recognize', power: 1.0, element: 'shadow', fx: 'shadow', timeLimitMs: null, description: 'Corrupted glyphs tear at you.' }),
  shieldBash: m({ id: 'shieldBash', name: 'Shield Bash', nameJa: '盾打ち', prompt: 'recognize', power: 1.2, element: 'steel', fx: 'rock', timeLimitMs: null, description: 'A painted round shield, to the face.' }),
  oniClub: m({ id: 'oniClub', name: 'Iron Club', nameJa: '金棒', prompt: 'recognize', power: 1.4, element: 'steel', fx: 'heavySlash', timeLimitMs: null, description: "The oni's iron club." }),
} satisfies Record<string, Move>;

export type MoveId = keyof typeof MOVES;

export function getMove(id: string): Move {
  const move = (MOVES as Record<string, Move>)[id];
  if (!move) throw new Error(`Unknown move: ${id}`);
  return move;
}
