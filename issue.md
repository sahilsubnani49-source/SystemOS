# SystemOS Development Issue Register

This is the working issue register for the single-user development build. It records
observed implementation gaps, stale subsystems, and production blockers so that a
future developer or LLM can understand the current state before changing behavior.

## Scope and priority

SystemOS is currently a personal, local-development app. Issues marked **deploy
blocker** do not prevent personal local use, but must be addressed before exposing
the backend to any other user or public network.

| Priority | Meaning |
|---|---|
| P0 | Data/privacy/cost risk when deployed, or severe user-facing malfunction |
| P1 | Core product behavior is incomplete or materially misleading |
| P2 | Correctness, resilience, maintenance, or developer-experience gap |
| P3 | Cleanup or deliberate product decision that needs confirmation |

## Status summary

Status key: ✅ **FIXED** · 🟡 **PARTIALLY FIXED** (the rest is listed under "Still open") · 🔴 **OPEN**

| ID | Issue | Priority | Status |
|---|---|---|---|
| SYS-001 | Backend state is shared process memory | P0 | ✅ FIXED (2026-09-12) |
| SYS-002 | AI endpoints: access control, CORS, rate limits, cost guardrail | P0 | 🟡 PARTIALLY FIXED: rate limits and provider budget still open |
| SYS-003 | Background task can repeat the daily notification | P1 | ✅ FIXED (2026-07-23) |
| SYS-004 | Hunter Rank is not implemented | P1 | ✅ FIXED (2026-07-23) |
| SYS-005 | Reward progression is flat for D through A quests | P1 | ✅ FIXED (2026-07-23) |
| SYS-006 | Offline nutrition fallback is unfinished | P1 | ✅ FIXED (2026-07-23) |
| SYS-007 | Local profile updates have no reconciliation contract | P2 | 🔴 OPEN |
| SYS-008 | Legacy mutation queue and legacy API reads are unused | P2 | 🔴 OPEN |
| SYS-009 | Campaign persistence is not atomic | P2 | ✅ FIXED (2026-07-23) |
| SYS-010 | Bootstrap errors can hang the loading screen | P2 | ✅ FIXED (2026-07-23) |
| SYS-011 | API timeout messages report the wrong duration | P2 | ✅ FIXED (2026-07-23) |
| SYS-012 | Lifecycle effect has stale dependency warnings | P2 | ✅ FIXED (2026-07-23) |
| SYS-013 | Lint is failing: 42 errors and 7 warnings | P1 | ✅ FIXED (2026-07-23) |
| SYS-014 | No automated test suite covers the SystemOS engine | P1 | 🔴 OPEN |
| SYS-015 | Production API URL is not configured | P2 | 🟡 PARTIALLY FIXED: Vercel URL set; no Cloud Run URL yet |
| SYS-016 | Documentation describes retired Flutter and legacy reward models | P1 | ✅ FIXED (2026-09-12) |
| SYS-017 | Offline-first scope needs a precise product definition | P3 | 🔴 OPEN (decision needed) |
| SYS-018 | Engine correctness sweep | P1 | 🟡 PARTIALLY FIXED: Hunter Log credit policy still open |
| SYS-019 | Kotodama: open items | P2 | 🔴 OPEN (tracking list) |
| SYS-020 | Second correctness sweep (races and stale day state) | P1 | ✅ FIXED (2026-11-02) |
| SYS-021 | Kotodama bug fixes | P2 | ✅ FIXED (2026-11-02) |
| SYS-022 | System Monitor (time-windowed technical logs) | P2 | ✅ BUILT (2026-11-02); 🔴 backend logs not merged |
| SYS-023 | Yotei: open items | P2 | 🔴 OPEN (tracking list) |

## Issues

### SYS-001 — Backend state is shared process memory

- **Status:** ✅ FIXED (2026-09-12) — per-user persistence added. `backend/app/db.py` stores `users` and `user_state`; every read/write goes through `get_user_state()` / `save_user_state()` keyed by the authenticated user. The `DEFAULT_*_STATE` dicts in `main.py` are now seed templates, deep-copied at signup, not shared mutable state.
- **Priority:** P0 — deploy blocker
- **Area:** `backend/app/main.py`, `backend/app/db.py`
- **Original behavior:** `player_state`, `quests_state`, and `inventory_state` were module-level Python variables, so every caller shared one profile and a restart lost all state.
- **Follow-up:** This resolves the correctness problem but changes the product's stated architecture — the backend is no longer stateless and now holds accounts. Reconcile with SYS-017.
- **2026-10-31:** `db.py` moved to SQLAlchemy Core behind the same function names (now `async`, run in a worker thread). `DATABASE_URL` selects SQLite locally or Neon Postgres in the cloud; the engine is created lazily so the app imports on Vercel's read-only filesystem. Schema changes still need Alembic (not yet adopted) — `create_all` never alters existing tables.

### SYS-002 — AI endpoints have no access control, rate limiting, or cost guardrail

- **Status:** 🟡 PARTIALLY FIXED (2026-10-31)
- **Priority:** P0 — deploy blocker
- **Area:** `backend/app/main.py`, `backend/app/auth.py`, `backend/app/config.py`
- **✅ Fixed:**
  - **Authentication (2026-09-12):** every `/api/*` route requires a Bearer access token via `Depends(get_current_user)`. JWT HS256 with 30-minute access and 30-day refresh tokens; passwords bcrypt-hashed with the 72-byte limit enforced.
  - **CORS (2026-10-31):** reads `CORS_ALLOW_ORIGINS`; empty in production, `*` only locally. (The native app sends no `Origin` header, so CORS never applies to it.)
  - **JWT secret fail-fast (2026-10-31):** `APP_ENV=production` refuses to start without a ≥32-character `JWT_SECRET_KEY`, or on a SQLite `DATABASE_URL`.
  - **`/health/llm` gated (2026-10-31):** needs a logged-in user in production; `EXPOSE_LLM_HEALTH=false` hides it with a 404.
- **🔴 Still open:** no per-user or per-IP rate limiting, request-size limit, or provider-budget monitoring. An authenticated account can still consume unbounded provider quota. Until this exists, Cloud Run's `--max-instances 3` and provider spend limits are the guardrail.
- **Suggested resolution:** per-user quotas and rate limits, request-size caps, and provider-budget monitoring before any deployment beyond personal use.

### SYS-003 — Background task can repeat the daily notification

- **Status:** ✅ FIXED (2026-07-23) — `DailyTimelineService` owns notification dedup via a shared `last_daily_notification_date` app_meta key; the background task consults the same key; `DailyResetService` was deleted.
- **Priority:** P1
- **Area:** `mobile/src/core/backgroundTasks.ts`, `mobile/src/data/services/DailyTimelineService.ts`
- **Original behavior:** The background task checked `last_quest_reset_date`, which the campaign timeline no longer wrote, so each eligible background run could send `[Daily Quest has arrived.]` again. The app ran two competing day-transition concepts.

### SYS-004 — Hunter Rank is not implemented

- **Status:** ✅ FIXED (2026-07-23) — `computeRank()` scores level, completion rate and dungeons cleared 0–3 points each against documented thresholds; the sum maps E → S.
- **Priority:** P1
- **Area:** `mobile/src/data/services/RankService.ts`
- **Original behavior:** `computeRank()` calculated `completionRate`, discarded it, and always returned `E-Rank`.

### SYS-005 — Reward progression is flat for D through A quests

- **Status:** ✅ FIXED (2026-07-23) — monotonic D–A odds filled between the E and S anchors (noReward 0.55 → 0.08, legendary 0.02 → 0.28); every distribution sums to ≤ 1.
- **Priority:** P1
- **Area:** `mobile/src/data/services/RewardService.ts`
- **Original behavior:** Drop odds were implemented only for E and S; D, C, B and A silently used E odds.

### SYS-006 — Offline nutrition fallback is unfinished

- **Status:** ✅ FIXED (2026-07-23) — `computeProteinTarget()` implements the documented BMI-band formula with input validation and a capped training-load bonus.
- **Priority:** P1
- **Area:** `mobile/src/data/services/NutritionService.ts`
- **Original behavior:** `computeProteinTarget()` was a TODO that always returned `null`, so no nutrition advice was available offline.

### SYS-007 — Local profile updates have no reconciliation contract

- **Status:** 🔴 OPEN
- **Priority:** P2
- **Area:** `mobile/src/presentation/stores/usePlayerStore.ts`, `mobile/src/core/useAppBootstrap.ts`
- **Current behavior:** Bio, aspirations, and model-preference saves are persisted locally when the profile API call fails, but the code only comments that they will sync later. There is no queued profile mutation or reconnect replay; reconnect only reloads inventory. Current reward and campaign requests already send most required context directly, so this does not normally break the personal app today.
- **Why it matters:** The profile endpoint's purpose is ambiguous: it is both legacy mock state and a purported remote context store. The current behavior is easy for a future feature to misunderstand and rely on incorrectly.
- **Suggested resolution:** Either make every AI endpoint self-contained and remove the expectation of profile sync, or implement a SQLite-backed profile sync queue replayed on connectivity restoration.

### SYS-008 — Legacy mutation queue and legacy API reads are unused

- **Status:** 🔴 OPEN (re-checked 2026-11-02: still nothing pushes to or replays the queue)
- **Priority:** P2
- **Area:** `mobile/src/data/database/MutationQueue.ts`, `mobile/src/data/datasources/ApiDataSource.ts`, `mobile/src/presentation/stores/useQuestStore.ts`
- **Current behavior:** `MutationQueue` defines only `COMPLETE_QUEST`, but no current code pushes or replays entries. `replayPendingMutations()` is a no-op. `getQuests()` and `getInventory()` API methods remain although current gameplay reads local SQLite.
- **Why it matters:** The code implies an offline replay guarantee that the current campaign architecture does not provide. It increases maintenance surface and causes design confusion.
- **Suggested resolution:** Choose one design: remove the obsolete queue/endpoints and document immediate static fallback rewards, or revive a well-defined queue that reconciles an AI-generated reward without duplicating local rewards.

### SYS-009 — Campaign persistence is not atomic

- **Status:** ✅ FIXED (2026-07-23) — `IGoalRepository.saveCampaign()` writes the goal and its quests in one SQLite transaction; the timeline cursor moves only after commit.
- **Priority:** P2
- **Area:** `mobile/src/presentation/stores/useGoalStore.ts`
- **Original behavior:** `persistCampaign()` saved the goal and its quests in separate calls, so a goal could exist without its daily work.

### SYS-010 — Bootstrap errors can leave the app indefinitely on the loading screen

- **Status:** ✅ FIXED (2026-07-23) — `boot()` is wrapped in try/catch/finally; `useAppBootstrap` returns `{ ready, error }`; `App.tsx` shows a `[System Error.]` recovery screen.
- **Priority:** P2
- **Area:** `mobile/src/core/useAppBootstrap.ts`, `mobile/App.tsx`
- **Original behavior:** A failed local load, migration, or timeline tick prevented `ready` from being set, so the app looked hung.

### SYS-011 — API timeout messages report the wrong duration

- **Status:** ✅ FIXED (2026-07-23) — the timeout message reports `error.config.timeout`, the effective per-request timeout.
- **Priority:** P2
- **Area:** `mobile/src/data/datasources/ApiDataSource.ts`
- **Original behavior:** Generation calls allow up to four minutes, but the interceptor always said the request timed out after 10 seconds.

### SYS-012 — Application lifecycle effect has stale dependency warnings

- **Status:** ✅ FIXED (2026-07-23) — the bootstrap effect reads store actions via `getState()` at call time, so the empty dependency list is honest.
- **Priority:** P2
- **Area:** `mobile/src/core/useAppBootstrap.ts`
- **Original behavior:** The effect had an empty dependency list while closing over six Zustand actions (an exhaustive-deps warning).

### SYS-013 — Lint is failing: 42 errors and 7 warnings

- **Status:** ✅ FIXED (2026-07-23) — all 42 errors and 7 warnings fixed (`useAnimatedValue`, key-based modal resets, `useItem` → `redeemItem` rename, escaped JSX apostrophes, module-level star field). Two narrowly justified `eslint-disable` lines remain (live clock, `axios.create`).
- **Priority:** P1
- **Area:** mobile lint baseline
- **Original behavior:** `npm run lint` failed with impure renders, setState in effects, a hook-named store action and unescaped JSX apostrophes.
- **Note (2026-11-02):** lint reports 0 errors and 1 warning: the unused `bankedMinutesToday` parameter of the `computeTaskCredit()` placeholder (see SYS-018). It goes away when that function is written.

### SYS-014 — No automated test suite covers the engine

- **Status:** 🔴 OPEN for SystemOS. (Kotodama's `@kotodama/core` has 160 Vitest tests; see SYS-019.)
- **Priority:** P1
- **Area:** `mobile/`, `backend/`
- **Current behavior:** SystemOS has no test runner or test files.
- **Why it matters:** Timeline penalties, level thresholds, dungeon keys, rank thresholds, date boundaries, and fallback behavior are all stateful and easy to regress.
- **Suggested resolution:** Add a lightweight TypeScript test runner and begin with pure services (`RankService`, nutrition, reward odds, date utilities, `computeFocusCredit`), then repository tests using a test SQLite database and API-service tests for fallback behavior.

### SYS-015 — Production API URL is not configured

- **Status:** 🟡 PARTIALLY FIXED (re-checked 2026-11-02)
- **Priority:** P2 — deploy blocker
- **Area:** `mobile/src/core/env.ts`, `mobile/eas.json`
- **✅ Fixed:**
  - The hardcoded placeholder is gone. Release builds read `EXPO_PUBLIC_API_URL` (inlined at bundle time), and `env.ts` throws at startup if it is missing or still a `REPLACE-WITH-…` placeholder.
  - `eas.json` sets `EXPO_PUBLIC_API_URL` to the deployed Vercel backend (`https://systemos-kappa.vercel.app`) on the `preview`, `preview-vercel` and `production` profiles.
- **🔴 Still open:** `preview` is documented as the *Cloud Run* APK but also points at Vercel; there is no Cloud Run URL anywhere. Once Cloud Run is deployed, put its URL on `preview` (or rename the profiles).

### SYS-016 — Documentation describes retired Flutter and legacy reward models

- **Status:** ✅ FIXED (2026-09-12) — all documentation rewritten against the current code.
- **Priority:** P1
- **Area:** `README.md`, `CLAUDE.md`, `docs/*`
- **Original behavior:** Documents referred to Flutter, Drift, Dart, stat-modifier equipment, aspiration-generated daily quests, a `POST /api/quests/generate` route that does not exist, and a stateless account-free backend.
- **What changed:** `docs/DOMAIN_MODELS.md`, `docs/DATABASE_ARCHITECTURE.md`, `docs/REWARD_SYSTEM.md`, `docs/AI_PROMPTS.md`, `README.md` and `CLAUDE.md` were rewritten against the code.
- **Follow-up:** Code is canonical. Keep docs updated in the same change as the behavior they describe.

### SYS-017 — Offline-first scope needs a precise product definition

- **Status:** 🔴 OPEN — decision needed, not a code bug
- **Priority:** P3 — clarification required
- **Area:** campaign creation and first-run initialization
- **Current behavior:** Once initialized, local campaign progress, quest completion, rewards, training, and timeline evaluation work locally. However, first-run player seeding and AI campaign creation require connectivity.
- **Why it matters:** "Offline-first" can be read as "everything works offline from a fresh install," which is not currently true.
- **Suggested resolution:** Decide and document the intended promise: "offline after initial setup," or provide a local first-run player and deterministic offline campaign generator.

### SYS-018 — Engine correctness sweep

- **Status:** 🟡 PARTIALLY FIXED (2026-11-01): everything below is fixed except the Hunter Log credit policy.
- **Priority:** P1
- **✅ Fixed:**
  - Double-tapping complete on a quest or dungeon paid XP and loot twice. An in-flight id guard in `useQuestStore` now blocks the repeat.
  - `addExperience` wrote the whole player row from memory (`INSERT OR REPLACE`), which could roll back keys and rank that the timeline had written. It now uses `PlayerRepository.saveProgress()`, which updates only level, XP and stats.
  - Today's quests were sorted alphabetically by rank (A…E, S). They now sort by the E → S ladder.
  - Campaigns never left `active`, so a finished campaign held one of the 3 slots forever. `DailyTimelineService.tick()` now marks a campaign `completed` once its end date has passed, and Hunter Rank still counts completed campaigns.
  - SCRAM left `penalty_notice_date` behind.
  - Backend: goal-mode reward completions were appended to the server inventory blob, which nothing reads. It grew without limit. An unknown `rarity` also reached the reward prompt unchanged.
- **🔴 Still open:** `computeTaskCredit()` in `useTaskLogStore.ts` gives full XP with no daily cap (it is still a placeholder, left for the owner to implement). Hunter Log time from Kotodama goes through it too.
- **Known, deliberate:** Settings → Daily reset clears today's completions, so the same quests can be completed again for XP and loot again. This is a dev affordance; gate it before release.

### SYS-019 — Kotodama: open items

- **Status:** 🔴 OPEN (tracking list; the bugs fixed so far are in SYS-021)
- **Priority:** P2
- **Area:** `games/kotodama/`, `mobile/src/presentation/screens/KotodamaScreen.tsx`
- **State (2026-11-02):** Arc 1 (hiragana), Arc 2 (katakana + 60 loanwords), Arc 3 (106 N5
  kanji + 102 N5 words), Arc 4 (133 N4 kanji + 105 N4 words + 30 sentences) and Arc 5 (150 N3
  kanji + 121 N3 words + 20 reading passages, the ending and the post-game Daily Trial) are
  playable in the standalone web build. Arc 1's title, hero select, overworld, dialogue, encounters,
  battles, purify and recruit, defeat, and save/reload were verified by a Playwright
  playthrough. Arc 2 was verified from seeded saves: ferry → Frost Harbor → Runa → a Mirror
  battle → purifying a Norse spirit, and the Skald's word trial with meaning and spell
  prompts. Arc 3 was verified from seeded saves: Runa's voyage → Castle Town → a kanji battle →
  purifying a spirit by typing a reading of 土, and the Shadow Shogun's mock exam. Arc 4 was
  verified from seeded saves: the Shogun's send-off → the foothills → a battle with sentence
  prompts → purifying a snow woman by typing a reading of 待, and the Tengu King's mock exam.
  Arc 5 was verified from seeded saves: the Tengu King's winds → Rune Coast → a battle with
  reading-passage prompts → purifying a spirit by typing a reading of 個; Jarl Ulfhild's N3
  exam → the credits → `game_complete`; and a Daily Trial that asked only seeded overdue items
  and could be fought again. The core has 160 Vitest tests, including a map validator, a
  boss-pacing simulation over all 29 bosses and the Daily Trial, and data checks on every
  kanji reading, word, sentence and passage.
- **🔴 Open:**
  - **Art and audio are procedural or absent.** The planned CC0 packs (Ninja Adventure, from
    itch.io / OpenGameArt) were blocked by the build environment's network policy. `expo-audio`
    is installed and configured, but nothing plays yet.
  - **SystemOS click-through not verified on a device.** Portal → game → Hunter Log
    type-checks and bundles for Android and iOS, but has only been exercised in code. SystemOS
    cannot run on web: react-native-web lacks `useAnimatedValue`, and `expo-secure-store` has no
    web implementation.
  - **Hunter Log XP from the game is uncapped** until `computeTaskCredit()` (a placeholder in
    `useTaskLogStore.ts`) is implemented; the bridge routes through it.
  - **The SystemOS dev client must be rebuilt** (`npx expo run:android|ios`) for Skia,
    Reanimated/Worklets, expo-audio, expo-speech and expo-haptics.
  - Full playthroughs of Arcs 2–5 have not been run end to end; their maps, story gates and
    boss balance are covered by the core tests.
  - The N5, N4 and N3 kanji, vocabulary, sentences and passages were written by hand (no
    dictionary data was used).
    The tests catch structural mistakes (wrong script, untaught kanji, duplicate meanings) but
    not a factually wrong reading or an unnatural sentence: a native-speaker review of
    `kanji.ts`, the vocabulary in `words.ts`, `sentences.ts` and `passages.ts` is worth doing.
  - Arc 5 covers ~150 core N3 kanji, not the full ~370. More can be added as further `n3…`
    groups the same way.
  - The Daily Trial's battle title ("Daily Trial · N due") only shows between turns; the
    due count is always visible in the menu's Party tab.

### SYS-020 — Second correctness sweep (races and stale day state)

- **Status:** ✅ FIXED (2026-11-02)
- **Priority:** P1
- **✅ Fixed:**
  - `POST /api/quests/{id}/complete` saved the state it read *before* the multi-second
    LLM call, even in goal mode where it changed nothing, so a profile update made
    meanwhile was reverted. It now writes only in the legacy mock-quest path.
    Reproduced with a stub reward generator that updates the bio mid-call.
  - Campaign drafting/forging set its busy flag only after `await isOnline()`, so a
    double-tap could forge two campaigns (two LLM runs, duplicated quests).
  - Exercise completion had no in-flight guard (unlike quests): a double-tap paid XP
    and counted a training day twice.
  - Gym hours used the in-memory total for today; with the app left open past midnight
    it applied yesterday's hours to today's 4h cap. The total is now read from SQLite,
    and the gym sheet re-reads it when opened.
  - The focus timer's AI description upgrade wrote the running timer back after an
    await, so stopping the timer during that write brought it back on screen.

### SYS-021 — Kotodama bug fixes

- **Status:** ✅ FIXED (2026-11-02)
- **Priority:** P2
- **Area:** `games/kotodama/`
- **✅ Fixed:**
  - **Duplicate React key on the battle result screen** ("Encountered two children with the
    same key, `A spirit reached Lv 7!`"). Every spirit's level-up line had the same text
    and was keyed by it, so two spirits reaching the same level collided and one line
    could be dropped. Lines now name the spirit and are keyed by position.
  - **Rune Scroll asked the same passage every turn.** With one passage in the pool (a
    Daily Trial with one overdue passage), the "don't repeat the last item" rule had
    nothing else to choose. Dedicated draws now fall back to the whole pool. Regression
    test in `arc5.test.ts`.
  - **Short study sessions never reached the Hunter Log.** The game reported rounded
    whole minutes on every backgrounding and reset its counter; SystemOS drops sessions
    under a minute. Time now accumulates until a full minute and carries leftover seconds.
  - **A save that failed to open left the game on a blank screen forever.** `boot()` threw
    and never left the boot screen. It now shows the title (without Continue) and reports
    the failure through the new `onDiagnostic` prop. Save-write failures, previously
    unhandled promise rejections, are reported the same way.

### SYS-022 — System Monitor (time-windowed technical logs)

- **Status:** ✅ BUILT (2026-11-02). Backend logs are not merged in (still open, below).
- **Priority:** P2
- **Area:** `mobile/src/data/services/MonitorService.ts`, `DiagnosticsRepository.ts`,
  `presentation/components/SystemMonitorCard.tsx`, `DiagnosticsModal.tsx`
- **What it does:** Settings → System Monitor opens a recording window (30 min, 2 h, 24 h, or
  until stopped, capped at 7 days). Only inside it, the app records technical events to the
  `diagnostic_logs` table:
  - every backend call (route, status, duration, AI fallback);
  - uncaught JS errors, and render errors via `SystemErrorBoundary`;
  - boot timings, auth changes, foreground/background, online/offline;
  - timeline ticks, timer start/stop/recover, and quest reward paths;
  - store failures;
  - Kotodama open/close, study sessions, and its save and render errors.

  Logs can be viewed with a severity filter, exported as text through the system share
  sheet, and cleared. Tokens, bodies and the Hunter's own text are never recorded.
- **Verified:** type-check, lint, Android bundle, and a throwaway Vitest harness over the real
  `MonitorService`. It covered no writes outside a window, redaction, a window that expires
  closing itself exactly once, the 7-day cap, and the export format. On-device use is not yet
  verified, because SystemOS can't run on web.
- **🔴 Still open:** server-side logs (FastAPI `logging`) stay in Cloud Run / Vercel and are
  not merged into the phone's log. The device records each call's status and round-trip
  time, which covers most diagnosis.

### SYS-023 — Yotei: open items

- **Status:** 🔴 OPEN (tracking list). Yotei was built on branch `claude/yotei` (2026-11-02).
- **Priority:** P2
- **Area:** `apps/yotei/`, `backend/app/services/plan_parser.py`, `mobile/src/presentation/screens/YoteiScreen.tsx`
- **Verified:**
  - `@yotei/core`: 36 Vitest tests.
  - Backend gate (`backend/tests/test_plan_parser.py`): shared vectors, verbatim gate, 422/413/502/401, chunking. Checked to fail when the quote check is disabled.
  - Playwright on the standalone web export (Asia/Kolkata, mocked backend and clock): an invented item is dropped by the device; a weekday slot is placed correctly; the week rolls over at local midnight with undone items overdue; state survives a reload.
  - SystemOS type-checks, lints and bundles for Android with Yotei inside.
- **🔴 Open:**
  - **Live LLM quality not measured.** The gate guarantees nothing unquoted is shown, but a weak model may *miss* items: they appear under "Not picked up", never silently. Converting written dates like "12 Jan" (no year) is left null by design.
  - **Not run on a device.** Rebuild the dev client for `expo-document-picker` and `expo-file-system` (SystemOS and the standalone app).
  - **Not linked to SystemOS XP or the Hunter Log.**
  - **No reminders/notifications** for upcoming slots yet.
  - The parse route has no per-user rate limit (same gap as SYS-002).

## Validation baseline

| Check | Result (2026-11-02) |
|---|---|
| `cd mobile && npx tsc --noEmit` | Passes |
| `./backend/venv/bin/python -m compileall -q backend/app` | Passes |
| `cd mobile && npm run lint` | 0 errors, 1 warning (the `computeTaskCredit()` placeholder, SYS-018) |
| Automated tests | SystemOS: none (SYS-014). `@kotodama/core`: 160 passing. `@yotei/core`: 36 passing. `backend/tests/test_plan_parser.py`: 5 passing |

## Recommended implementation order

1. ✅ Consolidate day/timeline handling and stop duplicate background notifications.
2. ✅ Finish rank, reward-progression, and local nutrition mechanics.
3. 🟡 Establish a clean lint baseline (✅ done) and introduce tests for pure engine logic (🔴 open, SYS-014).
4. ✅ Make campaign writes atomic and bootstrap failures recoverable.
5. 🔴 Decide the offline sync contract; remove dead legacy code or implement it fully (SYS-007, SYS-008).
6. 🔴 Implement the Hunter Log credit policy, `computeTaskCredit()` (SYS-018).
7. 🔴 Before any deployment beyond personal local use, close the rest of SYS-002 (rate limits, provider budget) and SYS-015 (a Cloud Run URL).
