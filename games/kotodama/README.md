# Kotodama (言霊)

A samurai / ninja / Viking monster-collecting RPG for learning Japanese, from
hiragana through katakana to JLPT N5 → N3. Wild **Kotodama** (word spirits) have been
corrupted into **Mojibake** by raiders' rune magic. Read them correctly to fight them,
and type a weakened spirit's true kana to **purify** it into your party. A spirit
**evolves from your mastery of its kana row**, not from XP, so your collection is a
live map of what you can read.

It runs inside SystemOS (Apps tab → *Gate of Words*) **and** as its own app.

| Arc | Setting | Teaches | Status |
|---|---|---|---|
| 1 | Sakura Valley (8 maps) | All hiragana: basic, voiced, combined | Playable |
| 2 | Frost Harbor (6 maps, reached by ferry after the Oni) | All katakana; 60 loanwords with ー and ッ; hiragana↔katakana Mirror prompts | Playable |
| 3 | Castle Capital (6 maps, reached on Runa's longship after the Champion) | 106 N5 kanji in 10 groups; 102 N5 words; the Shadow Shogun's N5 mock exam | Playable |
| 4 | Mountain Temples (6 maps, reached via the Shogun after the Arc 3 finale) | 133 N4 kanji in 11 groups; 105 N4 words; 30 fill-in-the-blank sentences; the Tengu King's N4 mock exam | Playable |
| 5 | Northern Runeforge (6 maps, reached on the Tengu King's winds after the Arc 4 finale) | 150 core N3 kanji in 10 groups; 121 N3 words; 20 reading passages; Jarl Ulfhild's N3 mock exam, the ending and credits | Playable |

**The Well of Old Tales** is a side dungeon, not an arc: once the Oni falls, Grandmother Fumi
(Sakura Village, west of the bridge) opens the old well east of it. Everything inside is
**plain hiragana**, so it can be played straight after Arc 1.

| Floor | Teaches | Tale to read | Guardian's seal (permanent, whole party) |
|---|---|---|---|
| Hall of Words | 56 everyday words (いぬ, もも, たべる…) | ももたろう | Seal of Words: +4% attack |
| Hall of the Heart | 17 phrases and proverbs (いただきます, ななころび やおき…) | うらしまたろう | Seal of Heart: +4% defence |
| Hall of Rules | 24 grammar sentences: particles and verb endings, each with its rule | つるの おんがえし | Seal of Rules: +6% HP |
| The Bottom of the Well | Everything above, mixed | かぐやひめ | Seal of the Deep: +3% to all three |

Each floor's Scroll Keeper holds a folk tale to read (`ui/TaleReader.tsx`: hiragana with
spaces between words, English folded away, read-aloud). Reading it to the end sets
`read_<tale>` and calls up the floor's guardian, the tale's own hero, who then asks about it.
Fumi also teaches **FOCUS** (below).

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
  onDiagnostic={(event) => …}      // optional: save/load failures and caught render errors
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
- **FOCUS** (learned from Fumi, then offered in every battle): the acting party member spends
  the turn on a hard hiragana puzzle (`content/puzzles.ts`): put word tiles into a sentence
  (**order**), rebuild a word from its shuffled kana (**scramble**), answer a なぞなぞ
  (**riddle**), or pick the word that does not belong (**oddOne**). Solving it starts a
  **spirit surge**: the party's next `SURGE_CHARGES` (3) damaging hits are multiplied by
  `surgeMultiplier()` (`battle/damage.ts`): x2.5, then x2, then x1.5. A wrong answer is countered like any other.
  FOCUS cannot be used again until the surge is spent.
- Purifying a kanji spirit means typing **any** of its readings (水: `mizu` or `sui`;
  macrons like `kō` accepted).
- A prompt tests a study item: a kana (`h-ka`, `k-ka`), a kanji (`j-水`), a loanword (`w-terebi`),
  a word (`v-gakusei`), a sentence (`c-1`) or a passage (`p-1`). The well adds a hiragana word
  (`n-inu`), a phrase (`f-1`), a grammar sentence (`g-1`), a tale question (`t-1`) and a
  FOCUS puzzle (`z-o1`).
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

## Team and reserve

Two spirits fight beside the hero (`PARTY_SIZE`); every further recruit waits in the
reserve (`save.box`). The menu's Party tab manages them: SWAP trades any two spirits'
places (team with reserve, or the order within the team), REST and JOIN TEAM move one
across, and RELEASE lets a spirit go for good after a yes/no. The rules are pure functions
in `core/src/save/party.ts`: a player who owns a spirit always has one on the team, and the
last spirit cannot be released. There is no switching during a battle.

## Voice

Japanese is read aloud in one of two ways, chosen per line by `speakJa`
(`game/src/audio/speak.ts`). Nothing is ever sent to a server.

**Device voice (always available).** The phone's own text-to-speech (`expo-speech`).
`speak.ts` lists the installed Japanese voices, ranks them (`scoreVoice`: premium and
enhanced voices first, Apple's novelty voices last) and speaks in the best one. The player
can pick another in the menu's System tab; the choice is saved as `save.voiceId`.

**Neural voice (optional, phones only).** Kokoro-82M, an open-weight Apache-2.0 model, run
on the device with `onnxruntime-react-native` (`game/src/audio/neural.ts`). The player
downloads it once from the System tab (about 93 MB from Hugging Face, the quantized ONNX
build plus the `jf_alpha` voice); it is not bundled. It only reads kana:

- `core/src/speech/kokoroJa.ts` turns kana into Kokoro's phoneme tokens: `kanaToPhonemes`
  rebuilds long vowels (こう is `koː`) and the particles は, へ, を from spelling, and returns
  `null` for anything it cannot do reliably (kanji, or a long run with no spaces). A `null`
  line goes to the device voice. `kokoroTables.ts` is generated from misaki's cutlet table
  and Kokoro's `config.json`; do not edit it by hand.
- Each spoken line is cached as a WAV, so only the first hearing waits for the model.
- The web build has a stub (`neural.web.ts`) and always uses the browser's voice.

`onnxruntime-react-native` is a native module: **rebuild the dev client** after pulling it
(`pod install`, then `expo run:ios` / `expo run:android`), for the standalone app and for
SystemOS. In a build made before it was added, the menu says the engine is missing and the
device voice is used. Not yet verified on a device: see SYS-019 in `issue.md`.

Asking for the same line twice within a few seconds replays it slowly, with either voice.

## The Terakoya (Castle Town's school)

Through the west house door in Castle Town (Arc 3): eleven classrooms and two mock-exam
halls, in the lesson order of Genki I-II and Minna no Nihongo I-II. Only the order and the
grammar points follow those courses (read from their contents pages); every word, sentence,
listening line and exam question was written for this game. Nothing is copied from them.

| Room | Map / area | Grammar | Exam |
|---|---|---|---|
| 1 | `terakoya_1` / `lesson1` | です, の, これ/それ/あれ, numbers, prices | Sensei Hana |
| 2 | `terakoya_2` / `lesson2` | ます verbs, に/で/を/へ, ませんか, past | Sensei Ito |
| 3 | `terakoya_3` / `lesson3` | い/な adjectives, すき, て-form requests and rules | Sensei Kato |
| 4 | `terakoya_4` / `lesson4` | ている, plain forms, と おもう, たことが ある, たら | Head Teacher Ono |
| 5 | `terakoya_5` / `lesson5` | plain past, describing nouns, もう/まだ, comparing, つもり, なる | Sensei Kudo |
| 6 | `terakoya_6` / `lesson6` | んです, すぎる, ほうが いい, ので, なければ, でしょう | Sensei Nakamura |
| N5 hall | `terakoya_n5` / `jlpt5` | everything from rooms 1-6, plus JLPT ★ questions | Proctor Ishida |
| 7 | `terakoya_7` / `lesson7` | potential, し, そう (looks), てみる, なら, かもしれない, giving | Sensei Rin |
| 8 | `terakoya_8` / `lesson8` | volitional, ておく, relative clauses, てくれる/もらう | Sensei Aoki |
| 9 | `terakoya_9` / `lesson9` | そう (hearsay), って, たら, transitive pairs, てしまう, ながら | Skald Eyvind |
| 10 | `terakoya_10` / `lesson10` | honorific and humble Japanese, はず, かどうか, やすい | Chamberlain Hosokawa |
| 11 | `terakoya_11` / `lesson11` | passive, てある, あいだに, causative, ば, のに | Master Kurama |
| N4 hall | `terakoya_n4` / `jlpt4` | everything from rooms 7-11, plus ★ questions of both levels | Grand Examiner Kanda |

Each classroom has 16 words (`n-` ids, `words.ts`), 12 grammar sentences with a rule note
(`b-` ids, `sentences.ts`) and 8 listening exercises (`l-` ids, `listening.ts`); rooms 5-11
also review the room before. Passing an exam sets `pass_lessonN` (or `pass_jlpt5` /
`pass_jlpt4`) and opens the next door. A pupil in each classroom offers repeatable practice
battles; the exam halls have no wild spirits and an attendant who heals. Rewards: Warashi
(room 4), Yamabiko (N5 hall), Baku (N4 hall), and the two exam certificates, which sit in
`SEALS` as small permanent party bonuses.

**Listening** is its own prompt kind, `hear`: a speaker, an English question, English
answers, never timed, replay by tapping; the text and translation appear on the reveal.

**JLPT ★ questions** (`STARS` in `puzzles.ts`, ids `z-j5-n` / `z-j4-n`) copy the exam's
sentence-building format: four pieces, one blank marked ★. They are built as `arrange`
prompts with the frame as the clue; the reveal names the ★ piece. They are kept out of
`PUZZLES`, so FOCUS (from Arc 1) never offers an N4 question.

Everything in the school is kana with spaces between words, so the neural voice reads all
of it; a test checks every line converts.

## Music and sound effects

The "Terakoya Study Lo-Fi" pack: 25 looping tracks in `game/assets/audio/music/` and 12
one-shot effects in `game/assets/audio/sfx/`, played with `expo-audio`
(`game/src/audio/music.ts`).

- **Which track plays** is `musicSlotFor()` in `core/src/save/audio.ts`: the title screen,
  a battle (`wild_battle` or `boss_battle`), the open menu (`menu`), otherwise the current
  map's `MapDef.music` slot. Files are named after the slots. A new map slot needs a file,
  an entry in `TRACKS`, and the list in `audio.test.ts`.
- **The files are not the pack's originals.** The pack's loops are 4 to 11 seconds; the
  player leaves a small gap each time a file restarts, so each loop is repeated to about a
  minute and encoded as 96 kbps AAC (19 MB in all). Effects are the original WAVs.
- **Settings** live on the save (`save.audio`, read through `audioSettings()`): music and
  effects volume in ten notches, and a mute for each, in the menu's System tab. A new game
  keeps them.
- **Ducking:** `speakJa` lowers the music to 30% for roughly the length of the line.
- Music pauses when the app is in the background and stops when the game unmounts.
- Effects: menu tabs, the talk button, right and wrong answers, a solved JLPT ★ question,
  hits, FOCUS surge, battle start (boss sting or clappers), recruiting a spirit, a boss
  victory, finishing a tale.

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
- **The well:** hiragana words are the `NATIVE` table in `words.ts` (kept out of `WORDS`);
  phrases are `content/phrases.ts`; grammar sentences are `GRAMMAR` in `sentences.ts` (kept
  out of `SENTENCES`, which is exactly the N4 exam); tales and their questions are
  `content/tales.ts`; puzzles are `content/puzzles.ts` (an **order** puzzle lists every other
  natural word order in `alt`; scramble puzzles are generated from the words). `well.test.ts`
  fails anything that is not hiragana.
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
