import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  applyXp, battleXp, createRng, foeCombatant, getMap, heroCombatant, isWalkable, battlePool,
  migrateSave, newGame, nextStreak, PARTY_SIZE, reduce, rollEncounter, spiritCombatant, startBattle,
  step as stepFrom, toDateStr, visibleNpcs, warpAt,
  type BattleAction, type BattleState, type DialogueLine, type Facing, type FoeSpec, type HeroClass,
  type NpcDef, type OwnedSpirit, type Save,
} from '@kotodama/core';
import type { SaveStore } from '../storage/saveStore';
import { SessionTracker } from '../session/tracker';
import type { StudySessionReport } from '../types';

export type Screen = 'boot' | 'title' | 'heroSelect' | 'world' | 'battle';

export interface Dialogue {
  lines: DialogueLine[];
  index: number;
  /** NPC whose effects (gifts, flags, battle) run when the dialogue closes. */
  npc?: NpcDef;
}

export interface BattleContext {
  state: BattleState;
  /** Story battle: flag set on victory. Wild battles have none. */
  winFlag?: string;
  title: string;
  /** Results shown on the victory/defeat card. */
  result?: { xp: number; levelUps: string[]; recruited?: string; outcome: BattleState['phase'] };
}

export interface GameState {
  screen: Screen;
  save: Save | null;
  hasSave: boolean;
  dialogue: Dialogue | null;
  battle: BattleContext | null;
  /** Map banner ("Bamboo Grove / たけばやし"), cleared by the UI after showing. */
  banner: { name: string; nameJa: string; label: string } | null;
  /** Incremented on every successful step: the renderer animates toward the new tile. */
  stepId: number;
  /** Brief notice ("Your party was healed."). */
  toast: string | null;

  boot(): Promise<void>;
  openHeroSelect(): void;
  startNewGame(hero: HeroClass, name: string): Promise<void>;
  continueGame(): void;
  tryStep(dir: Facing): 'moved' | 'blocked' | 'busy';
  interact(): void;
  advanceDialogue(): void;
  battleAction(action: BattleAction): void;
  closeBattle(): void;
  toggleRide(): void;
  clearBanner(): void;
  clearToast(): void;
  persist(): Promise<void>;
  /** Report study time to the host (if any) and reset the session counters. */
  flushSession(): StudySessionReport | null;
}

export interface GameDeps {
  storage: SaveStore;
  onStudySession?: (r: StudySessionReport) => void;
  now?: () => number;
}

const AUTOSAVE_EVERY_STEPS = 25;

export function createGameStore(deps: GameDeps): StoreApi<GameState> {
  const now = deps.now ?? Date.now;
  const tracker = new SessionTracker();
  let stepsSinceSave = 0;

  return createStore<GameState>((set, get) => {
    const update = (fn: (s: Save) => Save) => {
      const save = get().save;
      if (save) set({ save: fn(save) });
    };

    const bannerFor = (mapId: string) => {
      const m = getMap(mapId).def;
      return { name: m.name, nameJa: m.nameJa, label: '' };
    };

    const say = (lines: DialogueLine[], npc?: NpcDef) => set({ dialogue: { lines, index: 0, npc } });

    const startStoryOrWildBattle = (foes: FoeSpec[], opts: { isBoss: boolean; area: string; winFlag?: string; title: string }) => {
      const save = get().save as Save;
      const rng = createRng(save.seed);
      // The Daily Trial ('review') builds its pool from the save's own SRS table.
      const pool = battlePool(opts.area, save.srs, now());
      const enemies = foes.map((f, i) => foeCombatant(f, `foe${i}`, pool, rng));
      const party = [heroCombatant(save), ...save.party.slice(0, PARTY_SIZE).map((p) => spiritCombatant(p, save.srs))];
      const state = startBattle({ party, enemies, kanaPool: pool, srs: save.srs, isBoss: opts.isBoss, seed: rng.next() * 2 ** 32 });
      update((s) => ({
        ...s,
        seed: rng.seed,
        dex: { ...s.dex, seen: [...new Set([...s.dex.seen, ...foes.map((f) => f.familyId)])] },
      }));
      set({ screen: 'battle', battle: { state, winFlag: opts.winFlag, title: opts.title } });
    };

    const runNpcEffects = (npc: NpcDef) => {
      const save = get().save as Save;
      if (npc.battle && (npc.battle.repeatable || !save.flags[npc.battle.winFlag])) {
        startStoryOrWildBattle(npc.battle.foes, {
          isBoss: npc.battle.isBoss ?? true,
          area: npc.battle.pool ?? getMap(save.mapId).def.area,
          winFlag: npc.battle.winFlag,
          title: npc.name ?? 'Battle',
        });
        return;
      }
      if (npc.setsFlag && !save.flags[npc.setsFlag]) {
        update((s) => {
          let next: Save = { ...s, flags: { ...s.flags, [npc.setsFlag as string]: true } };
          if (npc.givesSpirit) {
            const spirit: OwnedSpirit = { uid: `sp-${now()}`, familyId: npc.givesSpirit.familyId, level: npc.givesSpirit.level, xp: 0 };
            next = addSpirit(next, spirit);
          }
          if (npc.givesHorse) next = { ...next, horse: { ...next.horse, owned: true } };
          return next;
        });
        void get().persist();
      }
      if (npc.heals) set({ toast: 'Your party is fully rested.' });
      if (npc.travelsTo) {
        const t = npc.travelsTo;
        update((s) => ({
          ...s,
          mapId: t.map,
          x: t.x,
          y: t.y,
          horse: { ...s.horse, riding: s.horse.riding && getMap(t.map).def.rideable },
        }));
        set({ banner: bannerFor(t.map), toast: null });
        void get().persist();
      }
    };

    return {
      screen: 'boot',
      save: null,
      hasSave: false,
      dialogue: null,
      battle: null,
      banner: null,
      stepId: 0,
      toast: null,

      async boot() {
        const save = await deps.storage.load();
        set({ save, hasSave: !!save, screen: 'title' });
      },

      openHeroSelect: () => set({ screen: 'heroSelect' }),

      async startNewGame(hero, name) {
        const save = newGame(hero, name, new Date(now()).toISOString(), now());
        set({ save, hasSave: true, screen: 'world', banner: bannerFor(save.mapId), dialogue: null, battle: null });
        await get().persist();
      },

      continueGame() {
        const save = get().save;
        if (!save) return;
        const today = toDateStr(new Date(now()));
        // Saves written by a newer layout are re-validated before use.
        const valid = migrateSave(save) ?? save;
        set({
          save: { ...valid, streakDays: nextStreak(valid.lastPlayedDate, valid.streakDays, today), lastPlayedDate: today },
          screen: 'world',
          banner: bannerFor(valid.mapId),
        });
      },

      tryStep(dir) {
        const { save, dialogue, battle, screen } = get();
        if (!save || dialogue || battle || screen !== 'world') return 'busy';
        const map = getMap(save.mapId);
        const [nx, ny] = stepFrom(save.x, save.y, dir);
        if (!isWalkable(map, nx, ny, save.flags)) {
          if (save.facing !== dir) update((s) => ({ ...s, facing: dir }));
          return 'blocked';
        }

        const warp = warpAt(map, nx, ny);
        if (warp?.requires && !save.flags[warp.requires]) {
          update((s) => ({ ...s, facing: dir }));
          say([{ speaker: 'System', text: warp.lockedText ?? 'The way is shut.' }]);
          return 'blocked';
        }

        const today = toDateStr(new Date(now()));
        update((s) => ({
          ...s,
          x: nx,
          y: ny,
          facing: dir,
          // First step of a new day counts toward the study streak / horse bond.
          streakDays: s.lastPlayedDate === today ? s.streakDays : nextStreak(s.lastPlayedDate, s.streakDays, today),
          lastPlayedDate: today,
        }));
        set({ stepId: get().stepId + 1 });

        if (warp) {
          const dest = getMap(warp.to);
          update((s) => ({
            ...s,
            mapId: warp.to,
            x: warp.toX,
            y: warp.toY,
            // Indoors you dismount automatically.
            horse: { ...s.horse, riding: s.horse.riding && dest.def.rideable },
          }));
          set({ banner: bannerFor(warp.to) });
          void get().persist();
          return 'moved';
        }

        // Wild encounter roll, from the save's own RNG so reloading can't re-roll it.
        const rng = createRng(save.seed);
        const hit = save.party.length > 0 ? rollEncounter(map, nx, ny, rng, save.horse.riding) : null;
        update((s) => ({ ...s, seed: rng.seed }));
        if (hit) {
          const level = rng.int(hit.levels[0], hit.levels[1]);
          startStoryOrWildBattle([{ familyId: hit.familyId, level }], {
            isBoss: false,
            area: map.def.area,
            title: 'Wild Kotodama',
          });
          update((s) => ({ ...s, seed: rng.seed }));
          return 'moved';
        }

        if (++stepsSinceSave >= AUTOSAVE_EVERY_STEPS) void get().persist();
        return 'moved';
      },

      interact() {
        const { save, dialogue, battle } = get();
        if (!save || battle) return;
        if (dialogue) return get().advanceDialogue();
        const [fx, fy] = stepFrom(save.x, save.y, save.facing);
        const npc = visibleNpcs(getMap(save.mapId), save.flags).find((n) => n.x === fx && n.y === fy);
        if (!npc) return;
        const beaten = npc.battle && save.flags[npc.battle.winFlag];
        say(beaten && npc.afterDialogue ? npc.afterDialogue : npc.dialogue, npc);
      },

      advanceDialogue() {
        const d = get().dialogue;
        if (!d) return;
        if (d.index + 1 < d.lines.length) {
          set({ dialogue: { ...d, index: d.index + 1 } });
          return;
        }
        set({ dialogue: null });
        if (d.npc) runNpcEffects(d.npc);
      },

      battleAction(action) {
        const ctx = get().battle;
        const save = get().save;
        if (!ctx || !save || ctx.result) return;
        const before = ctx.state;
        const after = reduce(before, action);
        if (after === before) return;

        if (action.type === 'answer') {
          const last = after.answers[after.answers.length - 1];
          if (last) tracker.recordAnswer(last.itemId, last.correct, action.elapsedMs, before.srs, after.srs);
        }

        const done = ['won', 'lost', 'fled', 'recruited'].includes(after.phase);
        if (!done) {
          set({ battle: { ...ctx, state: after } });
          return;
        }

        // ── Battle over: fold results into the save. ───────────────────────
        const xp = battleXp(after);
        const levelUps: string[] = [];
        let recruitedName: string | undefined;
        let next: Save = { ...save, srs: after.srs };

        if (xp > 0) {
          const hero = applyXp(next.heroLevel, next.heroXp, xp);
          if (hero.levelsGained) levelUps.push(`${next.playerName} reached Lv ${hero.level}!`);
          next = { ...next, heroLevel: hero.level, heroXp: hero.xp };
          next = {
            ...next,
            party: next.party.map((p, i) => {
              if (i >= PARTY_SIZE) return p;
              const r = applyXp(p.level, p.xp, xp);
              if (r.levelsGained) levelUps.push(`A spirit reached Lv ${r.level}!`);
              return { ...p, level: r.level, xp: r.xp };
            }),
          };
        }
        if (after.phase === 'won' && ctx.winFlag) next = { ...next, flags: { ...next.flags, [ctx.winFlag]: true } };
        if (after.phase === 'recruited') {
          const foe = after.enemies[0];
          const purify = after.events.find((e) => e.type === 'purify');
          if (foe && purify && purify.type === 'purify') {
            recruitedName = foe.name.replace(/^Corrupted /, '');
            next = addSpirit(next, { uid: `sp-${now()}`, familyId: purify.familyId, level: foe.level, xp: 0 });
          }
        }
        if (after.phase === 'lost') {
          // Defeat: wake up in the dojo, healed. Lose a third of your gold, keep everything learned.
          next = { ...next, mapId: 'hayate_dojo', x: 6, y: 4, facing: 'up', gold: Math.floor(next.gold * 0.67) };
        }

        set({
          save: next,
          battle: { ...ctx, state: after, result: { xp, levelUps, recruited: recruitedName, outcome: after.phase } },
        });
        void get().persist();
      },

      closeBattle() {
        const ctx = get().battle;
        if (!ctx?.result) return;
        const lost = ctx.result.outcome === 'lost';
        set({ battle: null, screen: 'world', banner: lost ? bannerFor('hayate_dojo') : null });
        if (lost) say([{ speaker: 'Master Kaito', text: 'You were carried back to the dojo. Rest. Every mistake you made is now a kana you will remember.' }]);
        const save = get().save;
        if (!ctx.winFlag || !save) return;
        // Story battles continue the NPC's after-dialogue automatically.
        const npc = visibleNpcs(getMap(save.mapId), save.flags).find((n) => n.showIf === ctx.winFlag);
        if (npc && ctx.result.outcome === 'won') say(npc.dialogue, npc);
      },

      toggleRide() {
        const save = get().save;
        if (!save?.horse.owned) return;
        if (!getMap(save.mapId).def.rideable) {
          set({ toast: 'Hayate waits outside. No riding here.' });
          return;
        }
        update((s) => ({ ...s, horse: { ...s.horse, riding: !s.horse.riding } }));
      },

      clearBanner: () => set({ banner: null }),
      clearToast: () => set({ toast: null }),

      async persist() {
        const save = get().save;
        if (!save) return;
        stepsSinceSave = 0;
        await deps.storage.save(save);
      },

      flushSession() {
        if (!tracker.hasActivity) return null;
        const report = tracker.flush();
        deps.onStudySession?.(report);
        return report;
      },
    };
  });
}

/** Team first, then the box; the Kotodex records every recruit. */
function addSpirit(save: Save, spirit: OwnedSpirit): Save {
  const toParty = save.party.length < PARTY_SIZE;
  return {
    ...save,
    party: toParty ? [...save.party, spirit] : save.party,
    box: toParty ? save.box : [...save.box, spirit],
    dex: { ...save.dex, caught: [...new Set([...save.dex.caught, spirit.familyId])], seen: [...new Set([...save.dex.seen, spirit.familyId])] },
  };
}
