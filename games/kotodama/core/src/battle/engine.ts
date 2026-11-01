// Pure battle state machine: reduce(state, action) → new state. No timers, no
// rendering, no storage. The game layer animates `state.events` and feeds the
// player's answers back in as actions.

import { elementMultiplier, type Element } from '../content/elements';
import { getMove, type FxKind, type MoveId, type PromptKind } from '../content/moves';
import { isPassageId, isSentenceId } from '../content/items';
import { pickNextPrompt } from '../srs/pickNextPrompt';
import { recordAnswer, type SrsTable } from '../srs/schedule';
import { createRng } from '../util/rng';
import { computeDamage } from './damage';
import { buildPrompt, gradeAnswer, type Grade, type Prompt } from './prompts';

export interface Combatant {
  uid: string;
  side: 'party' | 'enemy';
  name: string;
  nameJa: string;
  sprite: string;
  element: Element;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  moves: MoveId[];
  comboStep: number;
  /** Next incoming hit is halved / dodged. Cleared when consumed. */
  guard: boolean;
  evade: boolean;
  /** Enemy only: spirit family this foe can be purified into, if any. */
  familyId?: string;
  /** Enemy only: its true kana, tested when purifying. */
  trueName?: string;
  /** Enemy only: already survived one lethal blow (see `hit`). */
  spared?: boolean;
}

export type BattlePhase = 'choose' | 'answer' | 'won' | 'lost' | 'fled' | 'recruited';

export type BattleEvent =
  | { type: 'prompt'; prompt: Prompt }
  | { type: 'graded'; grade: Grade; itemId: string; answer: string }
  | { type: 'fx'; fx: FxKind; from: string; to: string }
  | { type: 'damage'; target: string; amount: number; crit: boolean; effective: 'super' | 'weak' | 'normal' }
  | { type: 'miss'; from: string; to: string }
  | { type: 'guarded'; target: string }
  | { type: 'evaded'; target: string }
  | { type: 'heal'; target: string; amount: number }
  | { type: 'buff'; target: string; buff: 'guard' | 'evade' }
  | { type: 'combo'; count: number }
  | { type: 'faint'; target: string }
  | { type: 'spared'; target: string }
  | { type: 'purify'; target: string; familyId: string }
  | { type: 'purifyFail'; target: string }
  | { type: 'flee'; success: boolean }
  | { type: 'end'; outcome: 'won' | 'lost' | 'fled' | 'recruited' };

export interface AnswerLogEntry {
  itemId: string;
  correct: boolean;
}

export interface BattleState {
  phase: BattlePhase;
  turn: number;
  party: Combatant[];
  enemies: Combatant[];
  /** Index into `party` of whose move it is. */
  actor: number;
  pendingMove: MoveId | 'purify' | null;
  prompt: Prompt | null;
  combo: number;
  /** Events produced by the most recent action, for the renderer to play. */
  events: BattleEvent[];
  /** Every graded answer this battle; the caller folds these into the SRS table. */
  answers: AnswerLogEntry[];
  kanaPool: string[];
  /** SRS table, updated after every answer. Persist it when the battle ends. */
  srs: SrsTable;
  isBoss: boolean;
  seed: number;
}

export type BattleAction =
  | { type: 'choose'; move: MoveId; now: number }
  | { type: 'purify' }
  | { type: 'answer'; value: string; elapsedMs: number; now: number }
  | { type: 'flee' };

export interface BattleSetup {
  party: Combatant[];
  enemies: Combatant[];
  kanaPool: string[];
  srs: SrsTable;
  isBoss?: boolean;
  seed: number;
}

/** A foe below this HP fraction can be purified (recruited). */
export const PURIFY_THRESHOLD = 0.35;
/** Damage multiplier for the instant counter a wrong answer provokes. */
export const COUNTER_POWER = 0.5;

export function startBattle(setup: BattleSetup): BattleState {
  if (setup.kanaPool.length === 0) throw new Error('startBattle: empty kana pool');
  return {
    phase: 'choose',
    turn: 1,
    party: setup.party.map((c) => ({ ...c })),
    enemies: setup.enemies.map((c) => ({ ...c })),
    actor: firstAlive(setup.party),
    pendingMove: null,
    prompt: null,
    combo: 0,
    events: [],
    answers: [],
    kanaPool: [...setup.kanaPool],
    srs: setup.srs,
    isBoss: setup.isBoss ?? false,
    seed: setup.seed,
  };
}

function firstAlive(list: Combatant[], from = 0): number {
  for (let i = 0; i < list.length; i++) {
    const idx = (from + i) % list.length;
    if ((list[idx] as Combatant).hp > 0) return idx;
  }
  return -1;
}

const alive = (list: Combatant[]) => list.filter((c) => c.hp > 0);

/** True when the target enemy is weak enough, recruitable, and this isn't a boss. */
export function canPurify(state: BattleState): boolean {
  const target = alive(state.enemies)[0];
  return (
    state.phase === 'choose' &&
    !state.isBoss &&
    !!target?.familyId &&
    !!target.trueName &&
    target.hp / target.maxHp <= PURIFY_THRESHOLD
  );
}

/** Prompt kinds that only make sense on one kind of item, and how to recognise it. */
const DEDICATED_ITEMS: Partial<Record<PromptKind, (id: string) => boolean>> = {
  context: isSentenceId,
  passage: isPassageId,
};

export function reduce(state: BattleState, action: BattleAction): BattleState {
  const rng = createRng(state.seed);
  const s: BattleState = {
    ...state,
    party: state.party.map((c) => ({ ...c })),
    enemies: state.enemies.map((c) => ({ ...c })),
    events: [],
  };
  const finish = () => ({ ...s, seed: rng.seed });

  switch (action.type) {
    case 'choose': {
      if (s.phase !== 'choose') return state;
      const actor = s.party[s.actor];
      if (!actor || !actor.moves.includes(action.move)) return state;
      const move = getMove(action.move);
      const lastItem = s.answers[s.answers.length - 1]?.itemId;
      // Sentence moves (Echo Call) and passage moves (Rune Scroll) draw from the
      // area's sentences / passages when it has any; otherwise those would be ~1
      // prompt in 10 and the move would rarely be what it says.
      const ownItems = DEDICATED_ITEMS[move.prompt];
      const dedicated = ownItems ? s.kanaPool.filter(ownItems) : [];
      const itemId = pickNextPrompt(dedicated.length > 0 ? dedicated : s.kanaPool, s.srs, action.now, rng, lastItem);
      s.prompt = buildPrompt(move.prompt, itemId, s.kanaPool, rng, move.timeLimitMs);
      s.pendingMove = action.move;
      s.phase = 'answer';
      s.events.push({ type: 'prompt', prompt: s.prompt });
      return finish();
    }

    case 'purify': {
      if (!canPurify(s)) return state;
      const target = alive(s.enemies)[0] as Combatant;
      // The true name must be TYPED: purification is the hardest test in the game.
      s.prompt = buildPrompt('type', target.trueName as string, s.kanaPool, rng, null);
      s.pendingMove = 'purify';
      s.phase = 'answer';
      s.events.push({ type: 'prompt', prompt: s.prompt });
      return finish();
    }

    case 'answer': {
      if (s.phase !== 'answer' || !s.prompt || !s.pendingMove) return state;
      const prompt = s.prompt;
      const grade = gradeAnswer(prompt, action.value, action.elapsedMs);
      const correct = grade === 'correct';
      s.answers = [...s.answers, { itemId: prompt.itemId, correct }];
      // Live SRS: a kana missed now becomes due now, so it comes back this battle.
      s.srs = recordAnswer(s.srs, prompt.itemId, correct, action.now);
      s.events.push({ type: 'graded', grade, itemId: prompt.itemId, answer: prompt.answer });

      const actor = s.party[s.actor] as Combatant;
      const target = alive(s.enemies)[0] as Combatant;

      if (s.pendingMove === 'purify') {
        if (correct) {
          target.hp = 0;
          s.events.push({ type: 'fx', fx: 'light', from: actor.uid, to: target.uid });
          s.events.push({ type: 'purify', target: target.uid, familyId: target.familyId as string });
          s.events.push({ type: 'end', outcome: 'recruited' });
          s.phase = 'recruited';
          s.prompt = null;
          s.pendingMove = null;
          return finish();
        }
        s.combo = 0;
        s.events.push({ type: 'purifyFail', target: target.uid });
      } else {
        if (correct) {
          s.combo += 1;
          if (s.combo >= 2) s.events.push({ type: 'combo', count: s.combo });
          applyMove(s, actor, target, s.pendingMove, prompt, action.elapsedMs, rng);
        } else {
          s.combo = 0;
          s.events.push({ type: 'miss', from: actor.uid, to: target.uid });
        }
      }
      if (!correct && target.hp > 0) {
        // A misread opens your guard: the foe counters the one who missed, at half power.
        const move = getMove(rng.pick(target.moves));
        hit(s, target, actor, Math.max(0.6, move.power) * COUNTER_POWER, move.element, move.fx, false, 0, rng);
      }

      s.prompt = null;
      s.pendingMove = null;
      if (alive(s.enemies).length === 0) return end(s, 'won', rng);
      if (alive(s.party).length === 0) return end(s, 'lost', rng);

      // Enemies act once per ROUND (after every living party member has moved), so a
      // bigger party is an advantage, never a liability.
      const nextActor = firstAlive(s.party, s.actor + 1);
      if (nextActor <= s.actor) {
        enemyTurn(s, rng);
        if (alive(s.party).length === 0) return end(s, 'lost', rng);
      }

      s.turn += 1;
      s.actor = firstAlive(s.party, s.actor + 1);
      s.phase = 'choose';
      return finish();
    }

    case 'flee': {
      if (s.phase !== 'choose') return state;
      if (s.isBoss) {
        s.events.push({ type: 'flee', success: false });
        return finish();
      }
      const partySpd = Math.max(...alive(s.party).map((c) => c.spd));
      const foeSpd = Math.max(...alive(s.enemies).map((c) => c.spd));
      const success = rng.next() < Math.min(0.95, 0.5 + (partySpd - foeSpd) * 0.05);
      s.events.push({ type: 'flee', success });
      if (success) return end(s, 'fled', rng);
      enemyTurn(s, rng);
      if (alive(s.party).length === 0) return end(s, 'lost', rng);
      s.turn += 1;
      return finish();
    }
  }
}

function applyMove(
  s: BattleState,
  actor: Combatant,
  target: Combatant,
  moveId: MoveId,
  prompt: Prompt,
  elapsedMs: number,
  rng: ReturnType<typeof createRng>,
) {
  const move = getMove(moveId);
  if (move.self) {
    s.events.push({ type: 'fx', fx: move.fx, from: actor.uid, to: actor.uid });
    if (move.self === 'heal') {
      const amount = Math.max(1, Math.round(actor.maxHp * 0.3));
      const healed = Math.min(actor.maxHp - actor.hp, amount);
      actor.hp += healed;
      s.events.push({ type: 'heal', target: actor.uid, amount: healed });
    } else {
      actor[move.self] = true;
      s.events.push({ type: 'buff', target: actor.uid, buff: move.self });
    }
    return;
  }
  // Timed prompts crit when answered in the first third of the window; untimed
  // ones crit on every THIRD correct answer in a row (3, 6, 9...). Either way,
  // crits reward fluency, not luck. (A permanent crit after a 3-streak made the
  // samurai end every boss fight in ~7 answers.)
  const crit =
    prompt.timeLimitMs !== null ? elapsedMs <= prompt.timeLimitMs / 3 : s.combo >= 3 && s.combo % 3 === 0;
  hit(s, actor, target, move.power, move.element, move.fx, crit, s.combo - 1, rng);
}

function hit(
  s: BattleState,
  attacker: Combatant,
  defender: Combatant,
  power: number,
  element: Element,
  fx: FxKind,
  crit: boolean,
  combo: number,
  rng: ReturnType<typeof createRng>,
) {
  s.events.push({ type: 'fx', fx, from: attacker.uid, to: defender.uid });
  if (defender.evade) {
    defender.evade = false;
    s.events.push({ type: 'evaded', target: defender.uid });
    return;
  }
  let amount = computeDamage({
    atk: attacker.atk,
    def: defender.def,
    power,
    level: attacker.level,
    attackElement: element,
    defendElement: defender.element,
    combo: Math.max(0, combo),
    comboStep: attacker.comboStep,
    crit,
    variance: 0.9 + rng.next() * 0.2,
  });
  if (defender.guard) {
    defender.guard = false;
    amount = Math.max(1, Math.round(amount / 2));
    s.events.push({ type: 'guarded', target: defender.uid });
  }
  // The first blow that would destroy a recruitable wild spirit leaves it clinging on
  // at 1 HP instead. Without this, combo/crit damage skips straight past the purify
  // window and recruiting becomes luck. Bosses and named foes have no familyId.
  if (defender.side === 'enemy' && defender.familyId && !defender.spared && amount >= defender.hp && defender.hp > 1) {
    amount = defender.hp - 1;
    defender.spared = true;
    defender.hp = 1;
    s.events.push({ type: 'damage', target: defender.uid, amount, crit, effective: elementLabel(element, defender.element) });
    s.events.push({ type: 'spared', target: defender.uid });
    return;
  }
  defender.hp = Math.max(0, defender.hp - amount);
  s.events.push({ type: 'damage', target: defender.uid, amount, crit, effective: elementLabel(element, defender.element) });
  if (defender.hp === 0) s.events.push({ type: 'faint', target: defender.uid });
}

function elementLabel(a: Element, d: Element): 'super' | 'weak' | 'normal' {
  const m = elementMultiplier(a, d);
  return m > 1 ? 'super' : m < 1 ? 'weak' : 'normal';
}

function enemyTurn(s: BattleState, rng: ReturnType<typeof createRng>) {
  for (const foe of alive(s.enemies)) {
    const targets = alive(s.party);
    if (targets.length === 0) return;
    const target = rng.pick(targets);
    const move = getMove(rng.pick(foe.moves));
    hit(s, foe, target, Math.max(0.6, move.power), move.element, move.fx, false, 0, rng);
  }
}

function end(s: BattleState, outcome: 'won' | 'lost' | 'fled', rng: ReturnType<typeof createRng>): BattleState {
  s.phase = outcome;
  s.prompt = null;
  s.pendingMove = null;
  s.events.push({ type: 'end', outcome });
  return { ...s, seed: rng.seed };
}

/** XP each surviving party member earns from a won or recruited battle. */
export function battleXp(state: BattleState): number {
  if (state.phase !== 'won' && state.phase !== 'recruited') return 0;
  const base = state.enemies.reduce((sum, e) => sum + e.level * 14, 0);
  const accuracy = state.answers.length
    ? state.answers.filter((a) => a.correct).length / state.answers.length
    : 0;
  return Math.round(base * (state.isBoss ? 2 : 1) * (0.5 + accuracy * 0.5));
}
