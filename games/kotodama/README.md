# Kotodama (言霊)

A samurai / ninja / Viking monster-collecting RPG for learning Japanese, from
hiragana through katakana to JLPT N5 → N3. Wild **Kotodama** (word spirits) have been
corrupted into **Mojibake** by raiders' rune magic. Read them correctly to fight them,
and type a weakened spirit's true kana to **purify** it into your party. A spirit
**evolves from your mastery of its kana row**, not from XP, so your collection is a
live map of what you can read.

It runs inside SystemOS (Stats tab → *Gate of Words*) **and** as its own app.

| Arc | Setting | Teaches | Status |
|---|---|---|---|
| 1 | Sakura Valley (8 maps) | All hiragana: basic, voiced, combined | Playable |
| 2 | Frost Harbor (6 maps, reached by ferry after the Oni) | All katakana; 60 loanwords with ー and ッ; hiragana↔katakana Mirror prompts | Playable |
| 3 | Castle Capital (6 maps, reached on Runa's longship after the Champion) | 106 N5 kanji in 10 groups; 102 N5 words; the Shadow Shogun's N5 mock exam | Playable |
| 4 | Mountain Temples (6 maps, reached via the Shogun after the Arc 3 finale) | 133 N4 kanji in 11 groups; 105 N4 words; 30 fill-in-the-blank sentences; the Tengu King's N4 mock exam | Playable |
| 5 | Northern Runeforge (6 maps, reached on the Tengu King's winds after the Arc 4 finale) | 150 core N3 kanji in 10 groups; 121 N3 words; 20 reading passages; Jarl Ulfhild's N3 mock exam, the ending and credits | Playable |

After the credits, Master Kaito in the Hayate Dojo offers the **Daily Trial**: a repeatable
battle built from the player's most overdue SRS items across all five arcs
(`core/src/srs/review.ts`).

## Packages

```
games/kotodama/
├── core/   @kotodama/core   Pure TypeScript game rules. No React, no Expo. Vitest.
├── game/   @kotodama/game   React Native + Skia renderer. Exports <KotodamaGame/>.
└── app/    @kotodama/app    Standalone Expo app (com.sahildevhk.kotodama).
```

**Boundary rule:** nothing under `games/` imports from `mobile/` (check with
`grep -r "mobile/" games/`). A host talks to the game only through the props of
`<KotodamaGame/>`:

```ts
<KotodamaGame
  onExit={() => …}                 // host closes the game
  onStudySession={(report) => …}   // { activeMinutes, promptsAnswered, correct, itemsMastered, … }
  databaseName="kotodama.db"       // the game's OWN SQLite file
/>
```

SystemOS files reports under a "Japanese 🗾" Hunter Log bucket
(`useTaskLogStore.recordJapaneseSession`), so study time earns Hunter XP once,
through the normal daily cap.

## Commands

Install once, from the **repository root** (npm workspaces):

```bash
npm install
```

```bash
npm run test --workspace @kotodama/core      # Vitest: engine, SRS, maps, saves
npx tsc --noEmit -p games/kotodama/game       # type-check the renderer
```

Standalone app (needs a dev client build, like SystemOS):

```bash
cd games/kotodama/app && npx expo run:android   # or run:ios
cd games/kotodama/app && npm run web            # browser build (copies Skia's canvaskit.wasm first)
cd games/kotodama/app && eas build -p android --profile preview
```

## How a battle works

`core/src/battle/engine.ts` is a pure reducer: `reduce(state, action) → state`, with a
seeded RNG stored in the state, so a battle replays identically from the same inputs.
The renderer never computes rules. It plays back `state.events` (`fx`, `damage`,
`graded`, `spared`, `purify`, …) as animations, and HP bars drain in step with them.

- Each move maps to a prompt kind: **recognize** (see か → "ka"), **recall** ("ka" → か),
  **listen** (hear it → か), **type** (type "ka"), **mirror** (か → カ), **meaning**
  (テレビ → "television", 水 → "water"), **spell** ("terebi" → テレビ among near-miss
  spellings: dropped ー, missing ッ, シ/ツ and ソ/ン swaps) or **reading** (学生 →
  がくせい, 水 → みず, among near-miss readings: dropped っ, lost long vowel, wrong voicing).
  **context** (Arc 4) shows a sentence with a blank and its English translation; each
  sentence's wrong answers are hand-picked so none of them could also fit. Sentence
  moves (Echo Call) always draw a sentence when the area has any.
  **passage** (Arc 5) shows a short Japanese text, an English question and four English
  answers; it is never timed. Passage moves (Rune Scroll) always draw a passage when the
  area has any.
  For a kanji, **recall** means "find the kanji for this meaning" among real look-alikes
  (木/本/休/体), and no wrong reading choice is ever another valid reading of it.
- Purifying a kanji spirit means typing **any** of its readings (水: `mizu` or `sui`;
  macrons like `kō` accepted).
- A prompt tests a study item: a kana (`h-ka`, `k-ka`), a kanji (`j-水`), a loanword (`w-terebi`),
  a word (`v-gakusei`), a sentence (`c-1`) or a passage (`p-1`).
  `resolveKind` maps a move's kind onto one the item supports, so words are never
  typed and bare kana never asked for a meaning.
- Wrong answers come from real look-alikes first (ぬ/め/の, シ/ツ/ソ/ン).
- Right answers build combos. Ninja crits come from answering fast; samurai crits come from streaks.
- A wrong answer earns an immediate half-power counter. Enemies otherwise act once per round.
- **Boss pacing is tested.** `balance.test.ts` simulates every story boss against a party of
  the expected level answering perfectly, for both heroes, and requires 8–20 answers and a
  win. Change a boss's `hpScale` or a move's power and the test shows the new counts.
- The first lethal blow on a recruitable wild spirit leaves it at 1 HP, so the
  purify choice is always offered. Bosses never flee or recruit.
- Every answer updates the SRS table **during** the battle, so a missed kana comes back
  in the same fight. The table is saved when the battle ends.

## Adding content

- **Maps:** `core/src/world/maps/*.ts`, as ASCII rows (legend in `world/types.ts`), plus
  warps, NPCs (dialogue, gifts, story battles, flags) and encounter tables.
  `core/src/__tests__/maps.test.ts` checks every warp, NPC and story gate is reachable.
  Run it after every map edit; it caught five authoring bugs in Arc 1. It follows ferries
  (`travelsTo`) and checks each arc's story gates open in order.
- **Curriculum:** `core/src/content/curriculum.ts` decides which kana each area tests.
- **Spirits / moves / heroes:** `core/src/content/`.
- **Words:** `core/src/content/words.ts`: loanwords (`w-<romaji>`) and N5 vocabulary
  (`v-<romaji>`), by area. Romaji is DERIVED from the kana reading (`util/romaji.ts`),
  never typed; the converter is cross-checked against every hand-written loanword.
- **Kanji:** `core/src/content/kanji.ts`: on'yomi in katakana, kun'yomi in hiragana with
  okurigana after a `.` (た.べる). `arc3data.test.ts` checks the scripts, unique meanings,
  and that every vocabulary word only uses kanji its area (or an earlier one) teaches.
- **Sentences:** `core/src/content/sentences.ts` (`c-<n>` ids: append, never renumber).
  `arc4.test.ts` checks one blank per sentence, distinct wrong answers, and taught kanji only.
- **Passages:** `core/src/content/passages.ts` (`p-<n>` ids: append, never renumber).
  `arc5data.test.ts` checks 2–3 sentences, an English question, four distinct choices and
  taught kanji only.
- **More N3:** add further `n3…` kanji groups the same way. All data so far was written by
  hand; JMdict and KANJIDIC2 are CC BY-SA 4.0, so credit them in the ending if they are used.

## Art

All visuals are currently **procedural pixel art** drawn in code (`game/src/art/`):
paper-doll characters, 51 folklore-based spirit families with stage evolutions, and
40 tile painters. They are rasterized once into Skia images and scaled with
nearest-neighbour sampling. Every sprite is requested by a stable key (`samurai`,
`kobi1`, a map id) through `art/atlas.ts`.

**To use a real CC0 pack** (the plan names *Ninja Adventure* by Pixel-boy & AAA, CC0):
put the trimmed sheets in `game/assets/`, keep each pack's licence plus a `CREDITS.md`
next to them, and make `atlas.ts` resolve those keys from the sheets before falling back
to the procedural art. No screen code needs to change.

## Not done yet

- Real art and music. The CC0 hosts were blocked from the build environment, and
  `expo-audio` is installed for music and SFX but nothing plays yet.
- Inside SystemOS, the portal → game → Hunter Log path type-checks and bundles for
  Android and iOS but has not been clicked through on a device. SystemOS itself does
  not run on web (no `useAnimatedValue` in react-native-web, no web `expo-secure-store`).
