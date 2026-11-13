import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  applyXp, battleXp, createRng, familyStage, foeCombatant, focusPool, getFamily, getMap, getTale, heroCombatant, isWalkable, battlePool, dueCount, REVIEW_AREA, taleReadFlag,
  migrateSave, newGame, nextStreak, PARTY_SIZE, reduce, rollEncounter, spiritCombatant, startBattle,
  releaseSpirit, spiritToReserve, spiritToTeam, swapSpirits,
  step as stepFrom, toDateStr, visibleNpcs, warpAt,
  audioSettings, type AudioSettings,
  type BattleAction, type BattleState, type DialogueLine, type Facing, type FoeSpec, type HeroClass,
  type NpcDef, type OwnedSpirit, type Save,
} from '@kotodama/core';
import type { SaveStore } from '../storage/saveStore';
import { SessionTracker } from '../session/tracker';
import type { GameDiagnostic, StudySessionReport } from '../types';

export type Screen = 'boot' | 'title' | 'heroSelect' | 'world' | 'battle';

export interface Dialogue {
  lines: DialogueLine[];
  index: number;
  /** NPC whose effects (gifts, flags, battle) run when the dialogue closes. */
  npc?: NpcDef;
}

/** A folk tale being read: which one, and the page that is open. */
export interface TaleReading {
  taleId: string;
  page: number;
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
  /** The folk tale open in the reader, if any. Walking and talking wait for it. */
  tale: TaleReading | null;
  battle: BattleContext | null;
  /** Map banner ("Bamboo Grove / たけばやし"), cleared by the UI after showing. */
  banner: { name: string; nameJa: string; label: string } | null;
  /** Incremented on every successful step: the renderer animates toward the new tile. */
  stepId: number;
  /** Brief notice ("Your party was healed."). */
  toast: string | null;
  /** The game menu is open over the world (the music follows it). */
  menuOpen: boolean;

  boot(): Promise<void>;
  openHeroSelect(): void;
  startNewGame(hero: HeroClass, name: string): Promise<void>;
  continueGame(): void;
  tryStep(dir: Facing): 'moved' | 'blocked' | 'busy';
  interact(): void;
  advanceDialogue(): void;
  /** Turn the tale's page (dir -1 goes back). Past the last page, the tale counts as read. */
  turnTalePage(dir?: 1 | -1): void;
  /** Put the tale down without finishing it. */
  closeTale(): void;
  battleAction(action: BattleAction): void;
  /** Swap two spirits' places: team with reserve, or the order within the team. */
  swapSpirits(uidA: string, uidB: string): void;
  /** Reserve to team (needs a free place). */
  spiritToTeam(uid: string): void;
  /** Team to reserve (never the last team spirit). */
  spiritToReserve(uid: string): void;
  /** Let a spirit go for good (never the last one owned). */
  releaseSpirit(uid: string): void;
  closeBattle(): void;
  /** Choose the voice Japanese is read in (undefined: let the game pick). */
  setVoice(voiceId: string | undefined): void;
  /** Change sound settings (music or effects volume, mute). Saved at once. */
  setAudio(patch: Partial<AudioSettings>): void;
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
  onDiagnostic?: (e: GameDiagnostic) => void;
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

    /** Team changes happen in the menu, never mid-battle, and are saved at once. */
    const manageSpirits = (fn: (s: Save) => Save) => {
      const save = get().save;
      if (!save || get().battle) return;
      const next = fn(save);
      if (next === save) return;
      set({ save: next });
      void get().persist();
    };

    const say = (lines: DialogueLine[], npc?: NpcDef) => set({ dialogue: { lines, index: 0, npc } });

    const startStoryOrWildBattle = (foes: FoeSpec[], opts: { isBoss: boolean; area: string; winFlag?: string; title: string }) => {
      const save = get().save as Save;
      const rng = createRng(save.seed);
      // The Daily Trial ('review') builds its pool from the save's own SRS table.
      const pool = battlePool(opts.area, save.srs, now());
      const enemies = foes.map((f, i) => foeCombatant(f, `foe${i}`, pool, rng));
      // Seals (the Well of Old Tales) ride on the save's flags; so does knowing FOCUS.
      const party = [heroCombatant(save), ...save.party.slice(0, PARTY_SIZE).map((p) => spiritCombatant(p, save.srs, save.flags))];
      const state = startBattle({
        party, enemies, kanaPool: pool, focusPool: focusPool(save.flags), srs: save.srs, isBoss: opts.isBoss, seed: rng.next() * 2 ** 32,
      });
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
          title: npc.battle.pool === REVIEW_AREA ? `Daily Trial · ${dueCount(save.srs, now())} due` : npc.name ?? 'Battle',
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
      if (npc.readsTale) set({ tale: { taleId: npc.readsTale, page: 0 } });
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
      tale: null,
      battle: null,
      banner: null,
      stepId: 0,
      toast: null,
      menuOpen: false,

      async boot() {
        try {
          const save = await deps.storage.load();
          set({ save, hasSave: !!save, screen: 'title' });
        } catch (e) {
          // The save file couldn't be opened. Without this the game sat on its blank
          // boot screen forever; show the title (no Continue) and report it.
          deps.onDiagnostic?.({ level: 'error', message: 'Save load failed', data: errorData(e) });
          set({ save: null, hasSave: false, screen: 'title' });
        }
      },

      openHeroSelect: () => set({ screen: 'heroSelect' }),

      async startNewGame(hero, name) {
        // A new game keeps how this device is set up to sound: the voice and the volumes.
        const prev = get().save;
        const save = { ...newGame(hero, name, new Date(now()).toISOString(), now()), voiceId: prev?.voiceId, audio: prev?.audio };
        set({ save, hasSave: true, screen: 'world', banner: bannerFor(save.mapId), dialogue: null, tale: null, battle: null });
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
        const { save, dialogue, tale, battle, screen } = get();
        if (!save || dialogue || tale || battle || screen !== 'world') return 'busy';
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
        const { save, dialogue, tale, battle } = get();
        if (!save || battle || tale) return;
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

      turnTalePage(dir = 1) {
        const reading = get().tale;
        const save = get().save;
        if (!reading || !save) return;
        const tale = getTale(reading.taleId);
        const page = reading.page + dir;
        if (page < 0) return;
        if (page < tale.pages.length) {
          set({ tale: { ...reading, page } });
          return;
        }
        // The last page is turned: the tale is read, and its hero can be called up.
        const flag = taleReadFlag(tale.id);
        const first = !save.flags[flag];
        update((s) => ({ ...s, flags: { ...s.flags, [flag]: true } }));
        set({ tale: null });
        if (first) {
          say([{ speaker: 'System', text: `You read ${tale.title}. Something stirs at the far end of the hall: the one who lived this tale.` }]);
          void get().persist();
        }
      },

      closeTale: () => set({ tale: null }),

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
              if (r.levelsGained) {
                const form = getFamily(p.familyId).stages[familyStage(p.familyId, next.srs)];
                levelUps.push(`${form.name} reached Lv ${r.level}!`);
              }
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

      swapSpirits: (a, b) => manageSpirits((s) => swapSpirits(s, a, b)),
      spiritToTeam: (uid) => manageSpirits((s) => spiritToTeam(s, uid)),
      spiritToReserve: (uid) => manageSpirits((s) => spiritToReserve(s, uid)),
      releaseSpirit: (uid) => manageSpirits((s) => releaseSpirit(s, uid)),

      setAudio(patch) {
        update((s) => ({ ...s, audio: { ...audioSettings(s), ...patch } }));
        void get().persist();
      },

      setVoice(voiceId) {
        update((s) => ({ ...s, voiceId }));
        void get().persist();
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
        try {
          await deps.storage.save(save);
        } catch (e) {
          // Callers fire-and-forget persist(); a failure used to be an unhandled rejection.
          deps.onDiagnostic?.({ level: 'error', message: 'Save write failed', data: errorData(e) });
        }
      },

      flushSession() {
        if (!tracker.hasReportableTime) return null;
        const report = tracker.flush();
        deps.onStudySession?.(report);
        return report;
      },
    };
  });
}

function errorData(e: unknown): Record<string, unknown> {
  return e instanceof Error ? { name: e.name, error: e.message } : { error: String(e) };
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
