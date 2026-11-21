import { describe, expect, it } from 'vitest';
import { HONSAI_WORDS } from '../content/honsai/words';
import { HONSAI_SENTENCES, forgeIdsUpTo } from '../content/honsai/forge';
import { poolForArea } from '../content/curriculum';
import { MOVES, type PromptKind } from '../content/moves';
import { buildPrompt, resolveKind } from '../battle/prompts';
import { createRng } from '../util/rng';
import { getMap } from '../world/maps';
import { visibleNpcs } from '../world/types';

describe('Honsai words (from JMdict)', () => {
  it('have unique ids and unique meanings, so a battle never shows two right answers', () => {
    expect(new Set(HONSAI_WORDS.map((w) => w.id)).size).toBe(HONSAI_WORDS.length);
    expect(new Set(HONSAI_WORDS.map((w) => w.meaning.toLowerCase())).size).toBe(HONSAI_WORDS.length);
  });

  it('every verb and adjective knows how it conjugates', () => {
    const verbsByEnding = HONSAI_WORDS.filter((w) => /^(to |to do )/.test(w.meaning));
    for (const w of verbsByEnding) expect(w.cls, `${w.text}: ${w.meaning}`).not.toBe('');
  });

  it('readings are kana and the first three districts hold over 500 words', () => {
    for (const w of HONSAI_WORDS) expect(w.reading, w.text).toMatch(/^[ぁ-ゖァ-ヺー]+$/);
    expect(HONSAI_WORDS.length).toBeGreaterThan(1500);
  });
});

describe('Honsai grammar and the Verb Forge', () => {
  it('every question has one blank, a right answer and three distinct wrong ones', () => {
    for (const s of HONSAI_SENTENCES) {
      expect(s.text.split('＿＿').length, s.id).toBe(2);
      expect(new Set(s.wrong).size, s.id).toBe(3);
      expect(s.wrong, s.id).not.toContain(s.answer);
      expect(s.note, s.id).toBeTruthy();
    }
    expect(new Set(HONSAI_SENTENCES.map((s) => s.id)).size).toBe(HONSAI_SENTENCES.length);
    expect(forgeIdsUpTo(3).length).toBeGreaterThan(100);
  });
});

describe('Honsai districts', () => {
  it.each(['honsai1', 'honsai2', 'honsai3', 'honsai4', 'honsai5', 'honsai6', 'honsai7', 'honsai8', 'honsai9', 'honsai10', 'honsai11', 'honsai12', 'library1', 'library4', 'library15', 'honsai_forge3', 'honsai_forge6', 'honsai_forge9'])('%s builds a four-choice or typed prompt for every move, on every item', (area) => {
    const pool = poolForArea(area);
    expect(pool.length).toBeGreaterThanOrEqual(40);
    const kinds = [...new Set(Object.values(MOVES).map((m) => m.prompt))] as PromptKind[];
    const rng = createRng(5);
    for (const id of pool) {
      for (const kind of kinds) {
        const p = buildPrompt(kind, id, pool, rng, null);
        expect(p.kind, `${id} ${kind}`).toBe(resolveKind(kind, id));
        if (p.kind !== 'type') {
          expect(new Set(p.choices).size, `${id} ${kind}: ${p.choices.join(' / ')}`).toBe(4);
          expect(p.choices).toContain(p.answer);
        }
      }
    }
  });

  it('opens from the dojo only after the Jarl, and silenced villagers speak once their district is freed', () => {
    const dojo = getMap('hayate_dojo');
    const kaitoGoesEast = (flags: Record<string, boolean>) => visibleNpcs(dojo, flags).some((n) => n.travelsTo?.map === 'honsai_gate');
    expect(kaitoGoesEast({ starter: true })).toBe(false);
    expect(kaitoGoesEast({ starter: true, game_complete: true })).toBe(true);
    const gate = getMap('honsai_gate');
    const aisatsu = (flags: Record<string, boolean>) => visibleNpcs(gate, flags).filter((n) => n.id.startsWith('aisatsu')).map((n) => n.id);
    expect(aisatsu({})).toEqual(['aisatsu_silent']);
    expect(aisatsu({ beat_mute_gatekeeper: true })).toEqual(['aisatsu_free']);
  });
});

import { honsaiLedger } from '../content/honsai/ledger';

describe('the Word Ledger', () => {
  it('counts words met and words restored (remembered for a day), per district', () => {
    const [a, b] = HONSAI_WORDS;
    const ledger = honsaiLedger({
      [a!.id]: { id: a!.id, stage: 1, dueAt: 0, reps: 1, lapses: 0, lastSeenAt: 0 },
      [b!.id]: { id: b!.id, stage: 4, dueAt: 0, reps: 4, lapses: 0, lastSeenAt: 0 },
      'h-a': { id: 'h-a', stage: 5, dueAt: 0, reps: 9, lapses: 0, lastSeenAt: 0 },
    });
    expect(ledger).toMatchObject({ met: 2, restored: 1, total: HONSAI_WORDS.length });
    expect(ledger.districts[0]).toMatchObject({ district: 1, met: 2, restored: 1 });
  });
});

import { PARTICLE_GROUPS, PARTICLE_SENTENCES } from '../content/honsai/particles';

describe('the Hall of Joints (particles)', () => {
  it('every keeper teaches before testing, and every item has one blank, one answer, three distinct wrong ones and its rule', () => {
    for (const g of PARTICLE_GROUPS) {
      expect(g.teach.length, g.title).toBeGreaterThanOrEqual(3);
      expect(g.rows.length, g.title).toBeGreaterThanOrEqual(14);
    }
    for (const s of PARTICLE_SENTENCES) {
      expect(s.text.split('＿＿').length, s.id).toBe(2);
      expect(new Set(s.wrong).size, s.id).toBe(3);
      expect(s.wrong, s.id).not.toContain(s.answer);
      expect(s.note, s.id).toBeTruthy();
      expect(s.en.length, s.id).toBeGreaterThan(5);
    }
    expect(new Set(PARTICLE_SENTENCES.map((s) => s.id)).size).toBe(PARTICLE_SENTENCES.length);
  });

  it.each([...PARTICLE_GROUPS.map((g) => `joints${g.n}`), 'honsai_joints'])('%s builds a valid prompt for every move', (area) => {
    const pool = poolForArea(area);
    expect(pool.length).toBeGreaterThanOrEqual(14);
    const kinds = [...new Set(Object.values(MOVES).map((m) => m.prompt))] as PromptKind[];
    const rng = createRng(9);
    for (const id of pool)
      for (const kind of kinds) {
        const p = buildPrompt(kind, id, pool, rng, null);
        expect(p.kind).toBe('context');
        expect(new Set(p.choices).size, `${id}: ${p.choices.join(' / ')}`).toBe(4);
        expect(p.choices).toContain(p.answer);
      }
  });

  it('its door opens with the Gatekeeper', () => {
    const gate = getMap('honsai_gate');
    const door = (flags: Record<string, boolean>) => visibleNpcs(gate, flags).some((n) => n.travelsTo?.map === 'honsai_joints');
    expect(door({})).toBe(false);
    expect(door({ beat_mute_gatekeeper: true })).toBe(true);
  });
});

import { TILE_PROPS, tileAt } from '../world/types';

describe('Honsai districts 4-6', () => {
  it('each Bridge Spirit stands on the only way across its river, until its bridge is rebuilt', () => {
    const m = getMap('honsai_bridges');
    for (const id of ['bridge_south', 'bridge_north']) {
      const spirit = m.def.npcs.find((n) => n.id === id)!;
      expect(tileAt(m, spirit.x, spirit.y)).toBe('bridge');
      const crossings = Array.from({ length: m.width }, (_, x) => x).filter((x) => !TILE_PROPS[tileAt(m, x, spirit.y)].solid);
      expect(crossings, id).toEqual([spirit.x]);
      expect(visibleNpcs(m, { [spirit.battle!.winFlag]: true }).some((n) => n.id === id)).toBe(false);
    }
  });

  it('the road runs village → Kakehashi → Manabi Hill → Minato Harbour, each gate opened by its lieutenant', () => {
    const gate = (from: string, to: string) => getMap(from).def.warps.find((w) => w.to === to)?.requires;
    expect(gate('honsai_village', 'honsai_bridges')).toBe('beat_housekeeper');
    expect(gate('honsai_bridges', 'honsai_hill')).toBe('beat_bridge_breaker');
    expect(gate('honsai_hill', 'honsai_harbour')).toBe('beat_forgetful_sensei');
  });
});

import { conjugate } from '../content/honsai/conjugate';

describe('Honsai districts 7-9', () => {
  it('the ship, the garden gate and the valley pass each open with their lieutenant', () => {
    const gate = (from: string, to: string) => getMap(from).def.warps.find((w) => w.to === to)?.requires;
    expect(gate('honsai_harbour', 'honsai_kokoro')).toBe('beat_lost_navigator');
    expect(gate('honsai_kokoro', 'honsai_valley')).toBe('beat_hollow_heart');
    expect(gate('honsai_valley', 'honsai_matsuri')).toBe('beat_windless');
  });

  it('conjugates たい, そう and the adverb form, including the irregulars', () => {
    expect(conjugate('来る', 'くる', 'kuru', 'tai')).toEqual({ text: '来たい', reading: 'きたい' });
    expect(conjugate('勉強する', 'べんきょうする', 'suru', 'tai').text).toBe('勉強したい');
    expect(conjugate('いい', 'いい', 'ii-adj', 'adj-sou').text).toBe('よさそう');
    expect(conjugate('嬉しい', 'うれしい', 'i-adj', 'adj-sou').text).toBe('嬉しそう');
    expect(conjugate('元気', 'げんき', 'na-adj', 'adj-sou').text).toBe('元気そう');
    expect(conjugate('早い', 'はやい', 'i-adj', 'adj-ku').text).toBe('早く');
    expect(conjugate('静か', 'しずか', 'na-adj', 'adj-ku').text).toBe('静かに');
  });

  it('never asks for a form nobody says, and never calls casual ら抜き potentials wrong', () => {
    const ids = new Set(HONSAI_SENTENCES.map((s) => s.id));
    const id = (form: string, text: string) => `q-${form}-${HONSAI_WORDS.find((w) => w.text === text)!.id.slice(2)}`;
    expect(ids.has(id('tai', '降る'))).toBe(false);
    expect(ids.has(id('potential', '分かる'))).toBe(false);
    expect(ids.has(id('adj-sou', '赤い'))).toBe(false);
    expect(ids.has(id('tai', '食べる'))).toBe(true);
    const eat = HONSAI_SENTENCES.find((s) => s.id === id('potential', '食べる'))!;
    expect(eat.answer).toBe('食べられる');
    expect(eat.wrong).not.toContain('食べれる');
  });
});

import { LIBRARY_WINGS } from '../content/honsai/words';
import { HONSAI_GOAL } from '../content/honsai/ledger';

describe('Honsai districts 10-12 and the Great Library', () => {
  it('reaches the 5,000-word goal, with every Library word in a wing and no word twice', () => {
    expect(HONSAI_WORDS.length).toBeGreaterThanOrEqual(HONSAI_GOAL);
    const texts = HONSAI_WORDS.map((w) => `${w.text}|${w.reading}`);
    expect(new Set(texts).size).toBe(texts.length);
    const lib = HONSAI_WORDS.filter((w) => w.district === 13);
    expect(lib.every((w) => w.id.startsWith('x-l-') && w.area.startsWith('honsai_lib'))).toBe(true);
    expect(LIBRARY_WINGS.length).toBe(15);
  });

  it('every wing has a keeper who spars on that wing, inside the Library off the court', () => {
    const lib = getMap('honsai_library');
    const pools = lib.def.npcs.map((n) => n.battle?.pool).filter(Boolean);
    expect(pools.sort()).toEqual(LIBRARY_WINGS.map((n) => `library${n}`).sort());
    expect(getMap('honsai_court').def.warps.some((w) => w.to === 'honsai_library' && !w.requires)).toBe(true);
  });

  it('the road runs festival → court → Kawaraban → tower, and both seals guard their doors', () => {
    const gate = (from: string, to: string) => getMap(from).def.warps.find((w) => w.to === to)?.requires;
    expect(gate('honsai_matsuri', 'honsai_court')).toBe('beat_silent_drummer');
    expect(gate('honsai_court', 'honsai_kawaraban')).toBe('beat_masked_chamberlain');
    expect(gate('honsai_kawaraban', 'honsai_tower')).toBe('beat_rumour_eater');
    const m = getMap('honsai_tower');
    for (const id of ['seal_lower', 'seal_upper']) {
      const seal = m.def.npcs.find((n) => n.id === id)!;
      const doors = Array.from({ length: m.width }, (_, x) => x).filter((x) => !TILE_PROPS[tileAt(m, x, seal.y)].solid);
      expect(doors, id).toEqual([seal.x]);
    }
  });

  it('conjugates すぎる and the causative-passive, short form for Group 1', () => {
    expect(conjugate('飲む', 'のむ', 'mu', 'causpass').text).toBe('飲まされる');
    expect(conjugate('話す', 'はなす', 'su', 'causpass').text).toBe('話させられる');
    expect(conjugate('食べる', 'たべる', 'ichidan', 'causpass').text).toBe('食べさせられる');
    expect(conjugate('来る', 'くる', 'kuru', 'causpass').reading).toBe('こさせられる');
    expect(conjugate('飲む', 'のむ', 'mu', 'sugiru').text).toBe('飲みすぎる');
    expect(conjugate('いい', 'いい', 'ii-adj', 'adj-sugiru').text).toBe('よすぎる');
    const drink = HONSAI_SENTENCES.find((s) => s.id === `q-causpass-${HONSAI_WORDS.find((w) => w.text === '飲む')!.id.slice(2)}`)!;
    expect(drink.wrong).not.toContain('飲ませられる');
  });
});
