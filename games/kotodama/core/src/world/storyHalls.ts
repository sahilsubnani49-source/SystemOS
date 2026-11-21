import type { DialogueLine, MapDef, NpcDef } from './types';
import { CURRICULUM } from '../content/curriculum';
import { FOLK_SITES, type TaleSite } from '../content/folktales';
import { taleReadFlag } from '../content/tales';
import { SCENE_ARRIVE, sceneMapId, signpostTiles } from './taleSites';

// The Storyteller's Halls: one per arc, opened by beating that arc's final boss.
//
// The tales themselves stay out in the world, found by their signposts. The hall is
// the library you come back to: a lit lantern for every tale already found (talk to
// it and it carries you there), an unlit one for every tale still out there (it says
// which map to search), and a storyteller who keeps count and rewards a finished set.

export interface HallDef {
  arc: 1 | 2 | 3 | 4 | 5;
  /** The map whose gate leads in. */
  hub: string;
  /** Beating this boss opens the gate. */
  opensOn: string;
  keeper: { name: string; sprite: string; greeting: DialogueLine };
}

export const HALLS: readonly HallDef[] = [
  { arc: 1, hub: 'sakura_village', opensOn: 'beat_oni', keeper: { name: 'Kataribe Oto', sprite: 'folk:oldwoman:kataribe_oto',
    greeting: { ja: 'むかし むかし…', text: 'Mukashi mukashi: long, long ago. Every tale in Japan starts that way, and every one ends めでたし めでたし.' } } },
  { arc: 2, hub: 'frost_harbor', opensOn: 'beat_champion', keeper: { name: 'Gorō, the old sea-teller', sprite: 'folk:fisher:sea_teller_goro',
    greeting: { ja: 'うみの はなし', text: 'Sailors carry stories further than cargo. Even this far north, the tales of home came with us.' } } },
  { arc: 3, hub: 'castle_town', opensOn: 'beat_shogun', keeper: { name: 'Biwa monk Kōsen', sprite: 'folk:monk:biwa_kosen',
    greeting: { ja: '語り部', text: 'A kataribe, 語り部, is a teller of tales. In old Japan they carried whole histories in their memory.' } } },
  { arc: 4, hub: 'mountain_foothills', opensOn: 'beat_tengu_king', keeper: { name: 'Yamabito, the mountain teller', sprite: 'folk:oldman:yamabito',
    greeting: { ja: '炉端', text: 'Robata: the hearth. Mountain winters were long, and the tales were told around the fire, night after night.' } } },
  { arc: 5, hub: 'rune_coast', opensOn: 'beat_jarl', keeper: { name: 'Hilde the Wanderer', sprite: 'folk:woman:hilde_wanderer',
    greeting: { ja: '物語', text: 'Monogatari: a tale, literally "the telling of things". The oldest novel in the world is one: Genji Monogatari.' } } },
];

export const hallMapId = (arc: number) => `story_hall_${arc}`;
/** Set the first time the player reaches a tale's place (or finishes reading it). */
export const foundFlag = (taleId: string) => `found_${taleId}`;
export const hallRewardFlag = (arc: number) => `hall_reward_${arc}`;
/** Gold for reading every tale of an arc: bigger halls, bigger thanks. */
export const hallRewardGold = (arc: number) => 300 * arc;

const COLS = 6;

/** Which arc a folk tale belongs to: the arc of the map its signpost stands on. */
function arcOf(site: TaleSite, maps: readonly MapDef[]): number {
  const host = maps.find((m) => m.id === site.host);
  return host ? (CURRICULUM[host.area]?.arc ?? 1) : 1;
}

let sitesByArc: Map<number, TaleSite[]> | null = null;
/** The tales of an arc, in the order their lanterns stand. */
export function hallTales(arc: number, maps?: readonly MapDef[]): TaleSite[] {
  if (!sitesByArc) {
    if (!maps) throw new Error('hallTales called before the halls were built');
    sitesByArc = new Map();
    for (const s of FOLK_SITES) {
      const a = arcOf(s, maps);
      sitesByArc.set(a, [...(sitesByArc.get(a) ?? []), s]);
    }
  }
  return sitesByArc.get(arc) ?? [];
}

/** A tatami hall sized to its lanterns: rows of six, a lane between every row. */
function hallMap(hall: HallDef, sites: TaleSite[], hostName: (id: string) => string, back: { x: number; y: number }): MapDef {
  const rows = Math.max(1, Math.ceil(sites.length / COLS));
  const width = COLS * 2 + 3;
  const height = 4 + rows * 2 + 2;
  const door = Math.floor(width / 2);
  const grid = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      if (y === height - 1) return x === door ? 'D' : '#';
      if (x === 0 || x === width - 1 || y === 0) return '#';
      if (y === 1 && (x === 1 || x === width - 2)) return 'L';
      return 't';
    }).join(''),
  );
  const lanterns: NpcDef[] = sites.flatMap((s, i) => {
    const x = 2 + (i % COLS) * 2;
    const y = 4 + Math.floor(i / COLS) * 2;
    const t = s.tale;
    return [
      {
        id: `lit_${t.id}`, name: t.title, x, y, sprite: 'prop:storylantern', facing: 'down', showIf: foundFlag(t.id),
        dialogue: [{ speaker: 'Story Lantern', ja: t.titleJa, text: `${t.title}. The lantern flares, and the hall fades around you...` }],
        travelsTo: { map: sceneMapId(t.id), x: SCENE_ARRIVE.x, y: SCENE_ARRIVE.y },
      },
      {
        id: `unlit_${t.id}`, name: 'Unlit Lantern', x, y, sprite: 'prop:darklantern', facing: 'down', hideIf: foundFlag(t.id),
        dialogue: [{ speaker: 'Unlit Lantern', ja: t.titleJa, text: `A tale not yet found. It waits in ${hostName(s.host)}: look for a wooden signpost.` }],
      },
    ];
  });
  return {
    id: hallMapId(hall.arc),
    name: "Storyteller's Hall",
    nameJa: 'かたりべの やかた',
    area: '',
    rows: grid,
    warps: [{ x: door, y: height - 1, to: hall.hub, toX: back.x, toY: back.y }],
    npcs: [
      { id: `keeper_${hall.arc}`, name: hall.keeper.name, x: door, y: 2, sprite: hall.keeper.sprite, facing: 'down', storyteller: hall.arc, dialogue: [hall.keeper.greeting] },
      ...lanterns,
    ],
    encounterRate: 0,
    encounters: [],
    music: 'temple',
    weather: 'none',
    rideable: false,
  };
}

/** Add each hall's gate to its hub (hidden until the arc's boss falls) and the halls themselves. */
export function withStoryHalls(maps: MapDef[]): MapDef[] {
  sitesByArc = null;
  const name = (id: string) => maps.find((m) => m.id === id)?.name ?? id;
  const halls: MapDef[] = [];
  const out = maps.map((hub) => {
    const hall = HALLS.find((h) => h.hub === hub.id);
    if (!hall) return hub;
    const arrivals = maps.flatMap((m) => [
      ...m.warps.filter((w) => w.to === hub.id).map((w) => ({ x: w.toX, y: w.toY })),
      ...m.npcs.filter((n) => n.travelsTo?.map === hub.id).map((n) => ({ x: n.travelsTo!.x, y: n.travelsTo!.y })),
    ]);
    const [at] = signpostTiles(hub, 1, arrivals) as [{ x: number; y: number }];
    const sites = hallTales(hall.arc, maps);
    const map = hallMap({ ...hall }, sites, name, { x: at.x, y: at.y + 1 });
    halls.push({ ...map, area: hub.area });
    const gate: NpcDef = {
      id: `hall_gate_${hall.arc}`,
      name: "Storyteller's Hall",
      x: at.x,
      y: at.y,
      sprite: 'prop:hallgate',
      facing: 'down',
      showIf: hall.opensOn,
      dialogue: [{ speaker: 'Hall Gate', ja: 'かたりべの やかた', text: "The Storyteller's Hall. Every tale of this land is kept inside, found or not." }],
      travelsTo: { map: hallMapId(hall.arc), x: Math.floor((COLS * 2 + 3) / 2), y: map.rows.length - 2 },
    };
    return { ...hub, npcs: [...hub.npcs, gate] };
  });
  return [...out, ...halls];
}

/** How far the player has got with an arc's tales. */
export function hallReport(arc: number, flags: Record<string, boolean>) {
  const sites = hallTales(arc);
  const found = sites.filter((s) => flags[foundFlag(s.tale.id)] || flags[taleReadFlag(s.tale.id)]);
  const read = sites.filter((s) => flags[taleReadFlag(s.tale.id)]);
  return { total: sites.length, found: found.length, read: read.length, missing: sites.filter((s) => !found.includes(s)) };
}

/** What the keeper says right now; `reward` is set when this talk hands over the prize. */
export function storytellerLines(arc: number, flags: Record<string, boolean>, hostName: (mapId: string) => string): { lines: DialogueLine[]; reward: number } {
  const hall = HALLS.find((h) => h.arc === arc);
  if (!hall) return { lines: [], reward: 0 };
  const r = hallReport(arc, flags);
  const speaker = hall.keeper.name;
  const lines: DialogueLine[] = [
    { speaker, ...hall.keeper.greeting },
    { speaker, ja: `${r.found} / ${r.total}`, text: `You have found ${r.found} of the ${r.total} tales of this land, and read ${r.read} to the end. Lit lanterns carry you to the tales you have found.` },
  ];
  if (r.read === r.total && !flags[hallRewardFlag(arc)]) {
    lines.push({ speaker, ja: 'めでたし めでたし', text: `Every tale, read to the end! A teller is paid in coin and in listeners. Take ${hallRewardGold(arc)} gold, and my thanks.` });
    return { lines, reward: hallRewardGold(arc) };
  }
  if (r.read === r.total) {
    lines.push({ speaker, text: 'You know every tale here now. Walk back into them whenever you like: a good tale gets better the second time.' });
  } else if (r.missing.length > 0) {
    const next = r.missing[0] as TaleSite;
    lines.push({ speaker, ja: next.tale.titleJa, text: `Have you looked around ${hostName(next.host)}? Something there is waiting to be told.` });
  } else {
    lines.push({ speaker, text: 'You have found them all. Now read each one to its last page: the boards wait.' });
  }
  return { lines, reward: 0 };
}
