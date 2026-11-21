import type { MapDef, NpcDef } from './types';
import { TILE_PROPS, DEFAULT_LEGEND } from './types';
import type { SceneKind, TalePerson, TaleSite } from '../content/folktales/types';
import { FOLK_SITES } from '../content/folktales';

// Builds a small map for every folk tale (content/folktales) and the signpost on a
// story map that leads there. Scenes share one layout so authoring a tale is only
// data: the board by the door, the tale's heart in the middle, up to three people.
//
//   (3,2) board   (6,3) heart   (9,3) (4,5) (8,5) people   (6,7) arrive   (6,8) exit

const BOARD = { x: 3, y: 2 };
const HEART = { x: 6, y: 3 };
const PEOPLE = [{ x: 9, y: 3 }, { x: 4, y: 5 }, { x: 8, y: 5 }];
export const SCENE_ARRIVE = { x: 6, y: 7 };
const EXIT = { x: 6, y: 8 };

const SCENES: Record<SceneKind, { rows: string[]; music: string; darkness?: number }> = {
  house: { music: 'village', rows: [
    '#############', '#L_________L#', '#_ttttttttt_#', '#_ttttttttt_#', '#_ttttttttt_#',
    '#_ttttttttt_#', '#___________#', '#L_________L#', '######D######'] },
  inn: { music: 'teahouse', rows: [
    '#############', '#NNN#___#NNN#', '#___________#', '#_tttt_tttt_#', '#_tttt_tttt_#',
    '#___________#', '#L_________L#', '#___________#', '######D######'] },
  shrine: { music: 'shrine', rows: [
    'TTTTTTTTTTTTT', 'TS..L.I.L..ST', 'T...ggggg...T', 'T..ggggggg..T', 'T..ggggggg..T',
    'TL.ggggggg.LT', 'T*...===...*T', 'T....===....T', 'TTTTTT=TTTTTT'] },
  temple: { music: 'temple', rows: [
    'mmmmmmmmmmmmm', 'mL__L___L__Lm', 'm___________m', 'm_ttttttttt_m', 'm_ttttttttt_m',
    'm___________m', 'mS____g____Sm', 'm.....=.....m', 'mmmmmm=mmmmmm'] },
  shore: { music: 'shore', rows: [
    'WWWWWWWWWWWWW', 'W~~~~~~~~~~~W', '~~sssssssss~~', 'sssssssssssss', 'sssssssssssss',
    'sssssssssssss', 'ss...===...ss', 's....===....s', 'TTTTTT=TTTTTT'] },
  river: { music: 'river', rows: [
    'TTTTTTTTTTTTT', 'T...........T', 'T...........T', 'T.....,.....T', '~~H~~~~~~~H~~',
    'T...........T', 'T*...===...*T', 'T....===....T', 'TTTTTT=TTTTTT'] },
  forest: { music: 'forest', rows: [
    'TTTTTTTTTTTTT', 'TT.,,...,,.TT', 'T..,.....,..T', 'T.,.......,.T', 'T...........T',
    'T,.........,T', 'T*...===...*T', 'T....===....T', 'TTTTTT=TTTTTT'] },
  bamboo: { music: 'forest', rows: [
    'TTTTTTTTTTTTT', 'TBB.......BBT', 'TB.........BT', 'T...........T', 'TB.........BT',
    'TBB.......BBT', 'T....===....T', 'T....===....T', 'TTTTTT=TTTTTT'] },
  mountain: { music: 'mountain', rows: [
    'ccccccccccccc', 'co...e.e...oc', 'c...........c', 'c...........c', 'co.........oc',
    'c...........c', 'c....===....c', 'c....===....c', 'cccccc=cccccc'] },
  snow: { music: 'mountain', rows: [
    'PPPPPPPPPPPPP', 'PnnPnnnnnPnnP', 'PnnnnnnnnnnnP', 'PnnnnnnnnnnnP', 'PnnnnnnnnnnnP',
    'PnnnnnnnnnnnP', 'Pnnnn===nnnnP', 'Pnnnn===nnnnP', 'PPPPPP=PPPPPP'] },
  palace: { music: 'castle', rows: [
    'mmmmmmmmmmmmm', 'mS_L_____L_Sm', 'm___________m', 'm__ttttttt__m', 'm__ttttttt__m',
    'm___________m', 'mL____=____Lm', 'm_____=_____m', 'mmmmmm=mmmmmm'] },
  cave: { music: 'cave', darkness: 0.4, rows: [
    'ooooooooooooo', 'oo_________oo', 'o___________o', 'o___________o', 'o___________o',
    'oo_________oo', 'o____===____o', 'o____===____o', 'oooooo=oooooo'] },
  field: { music: 'village', rows: [
    '|||||||||||||', '|*.*.*.*.*.*|', '|...........|', '|.,,,...,,,.|', '|.,,,...,,,.|',
    '|...........|', '|S...===...S|', '|....===....|', '||||||=||||||'] },
  bridge: { music: 'river', rows: [
    'TTTTTTTTTTTTT', 'TL....L....LT', 'T...........T', 'T...........T', 'WWWWHHHHHWWWW',
    'T...........T', 'T*...===...*T', 'T....===....T', 'TTTTTT=TTTTTT'] },
  street: { music: 'market', rows: [
    'mmmmmmmmmmmmm', 'mNNNmNNNmNNNm', 'm.....=.....m', 'mL....=....Lm', 'm.....=.....m',
    'm...........m', 'm.L..===..L.m', 'm....===....m', 'mmmmmm=mmmmmm'] },
  night: { music: 'hideout', darkness: 0.5, rows: [
    'TTTTTTTTTTTTT', 'To.o.o.o.o.oT', 'T...........T', 'To.........oT', 'T...........T',
    'To.........oT', 'T....===....T', 'T....===....T', 'TTTTTT=TTTTTT'] },
};

export const sceneMapId = (taleId: string) => `tale_${taleId}`;
export const signpostId = (taleId: string) => `sign_${taleId}`;

const solidAt = (rows: string[], x: number, y: number) => {
  const ch = rows[y]?.[x];
  const kind = ch === undefined ? undefined : DEFAULT_LEGEND[ch];
  return !kind || TILE_PROPS[kind].solid;
};

/**
 * Tiles on a host map where signposts can stand: inside a fully open 3x3 (so a post
 * never cuts a path and the tile below it is free to arrive on), clear of warps,
 * people and anywhere a warp or ferry sets the player down.
 */
export function signpostTiles(host: MapDef, count: number, taken: { x: number; y: number }[]): { x: number; y: number }[] {
  const rows = host.rows;
  const near = (x: number, y: number, list: { x: number; y: number }[], r: number) =>
    list.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) <= r);
  const cands: { x: number; y: number }[] = [];
  for (let y = 1; y < rows.length - 1; y++)
    for (let x = 1; x < (rows[0]?.length ?? 0) - 1; x++) {
      let open = true;
      for (let dy = -1; dy <= 1 && open; dy++) for (let dx = -1; dx <= 1; dx++) if (solidAt(rows, x + dx, y + dy)) open = false;
      if (!open || near(x, y, host.warps, 2) || near(x, y, host.npcs, 2) || near(x, y, taken, 2)) continue;
      cands.push({ x, y });
    }
  // Spread them out: each next post goes as far as possible from everything placed.
  const placed: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const others = [...host.npcs, ...taken, ...placed];
    let best: { x: number; y: number } | undefined;
    let bestD = -1;
    for (const c of cands) {
      if (near(c.x, c.y, others, 2)) continue;
      const d = Math.min(99, ...others.map((o) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y)));
      if (d > bestD) {
        bestD = d;
        best = c;
      }
    }
    if (!best) throw new Error(`${host.id}: no room for ${count} tale signposts`);
    placed.push(best);
  }
  return placed;
}

const asNpc = (id: string, p: TalePerson, at: { x: number; y: number }): NpcDef => ({
  id,
  name: p.name,
  x: at.x,
  y: at.y,
  sprite: p.sprite,
  facing: 'down',
  dialogue: p.lines.map(([ja, text]) => ({ speaker: p.name, text, ...(ja ? { ja } : {}) })),
});

function sceneMap(site: TaleSite, host: MapDef, back: { x: number; y: number }): MapDef {
  const s = SCENES[site.scene];
  const t = site.tale;
  return {
    id: sceneMapId(t.id),
    name: site.place,
    nameJa: site.placeJa,
    area: host.area,
    rows: s.rows,
    warps: [{ x: EXIT.x, y: EXIT.y, to: host.id, toX: back.x, toY: back.y }],
    npcs: [
      {
        id: `board_${t.id}`, name: 'Tale Board', x: BOARD.x, y: BOARD.y, sprite: 'board', facing: 'down', readsTale: t.id,
        dialogue: [{ speaker: 'Tale Board', ja: t.titleJa, text: `"${t.title}". Read the whole tale, in kana or in kanji.` }],
      },
      asNpc(`heart_${t.id}`, site.heart, HEART),
      ...site.people.slice(0, PEOPLE.length).map((p, i) => asNpc(`tp_${t.id}_${i}`, p, PEOPLE[i] as { x: number; y: number })),
    ],
    encounterRate: 0,
    encounters: [],
    music: s.music,
    weather: site.weather ?? 'none',
    rideable: false,
    ...(s.darkness ? { darkness: s.darkness } : {}),
  };
}

/** Add every tale's signpost to its host and return the scene maps. */
export function withTaleSites(maps: MapDef[]): MapDef[] {
  const byHost = new Map<string, TaleSite[]>();
  for (const site of FOLK_SITES) byHost.set(site.host, [...(byHost.get(site.host) ?? []), site]);
  const scenes: MapDef[] = [];
  const out = maps.map((host) => {
    const sites = byHost.get(host.id);
    if (!sites) return host;
    // Never on a tile a warp or ferry from elsewhere lands on, nor right beside one.
    const arrivals = maps.flatMap((m) => [
      ...m.warps.filter((w) => w.to === host.id).map((w) => ({ x: w.toX, y: w.toY })),
      ...m.npcs.filter((n) => n.travelsTo?.map === host.id).map((n) => ({ x: n.travelsTo!.x, y: n.travelsTo!.y })),
    ]);
    const tiles = signpostTiles(host, sites.length, arrivals);
    const posts = sites.map((site, i): NpcDef => {
      const at = tiles[i] as { x: number; y: number };
      scenes.push(sceneMap(site, host, { x: at.x, y: at.y + 1 }));
      return {
        id: signpostId(site.tale.id),
        name: site.place,
        x: at.x,
        y: at.y,
        sprite: 'signpost',
        facing: 'down',
        dialogue: [{ speaker: 'Signpost', ja: site.placeJa, text: `This way: ${site.place}. Here they tell the tale of ${site.tale.title}.` }],
        travelsTo: { map: sceneMapId(site.tale.id), x: SCENE_ARRIVE.x, y: SCENE_ARRIVE.y },
      };
    });
    return { ...host, npcs: [...host.npcs, ...posts] };
  });
  return [...out, ...scenes];
}
