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

## Active issues

### SYS-001 — Backend state is shared process memory

- **Status:** RESOLVED (2026-09-12) — per-user persistence added. `backend/app/db.py` stores `users` and `user_state` in SQLite; every read/write goes through `get_user_state()` / `save_user_state()` keyed by the authenticated user. The `DEFAULT_*_STATE` dicts in `main.py` are now seed templates, deep-copied at signup, not shared mutable state.
- **Priority:** P0 — deploy blocker
- **Area:** `backend/app/main.py`, `backend/app/db.py`
- **Original behavior:** `player_state`, `quests_state`, and `inventory_state` were module-level Python variables, so every caller shared one profile and a restart lost all state.
- **Follow-up:** This resolves the correctness problem but changes the product's stated architecture — the backend is no longer stateless and now holds accounts. Reconcile with SYS-017.
- **2026-10-31:** `db.py` moved to SQLAlchemy Core behind the same function names (now `async`, run in a worker thread). `DATABASE_URL` selects SQLite locally or Neon Postgres in the cloud; the engine is created lazily so the app imports on Vercel's read-only filesystem. Schema changes still need Alembic (not yet adopted) — `create_all` never alters existing tables.

### SYS-002 — AI endpoints have no access control, rate limiting, or cost guardrail

- **Status:** PARTIALLY RESOLVED (2026-10-31) — authentication (2026-09-12), then CORS, JWT fail-fast and `/health/llm` gating via `app/config.py`. Quotas and provider-budget monitoring remain open.
- **2026-10-31 update:** CORS now reads `CORS_ALLOW_ORIGINS` (empty in production, `*` locally). `APP_ENV=production` refuses to start without a ≥32-char `JWT_SECRET_KEY` or on a SQLite `DATABASE_URL`. `/health/llm` needs a logged-in user in production (on by default so the app's Settings diagnostics work; `EXPOSE_LLM_HEALTH=false` hides it with a 404). Until real rate limiting exists, Cloud Run's `--max-instances 3` and provider spend limits are the guardrail.
- **Priority:** P0 — deploy blocker
- **Area:** `backend/app/main.py`, `backend/app/auth.py`
- **Resolved:** Every `/api/*` route now requires a Bearer access token via `Depends(get_current_user)`. JWT HS256 with 30-minute access and 30-day refresh tokens; passwords bcrypt-hashed with the 72-byte limit enforced.
- **Still open:**
  - `CORSMiddleware` is configured with `allow_origins=["*"]`.
  - No per-user or per-IP rate limiting, request-size limit, or provider-budget monitoring. An authenticated account can still consume unbounded provider quota.
  - `JWT_SECRET_KEY` falls back to a hardcoded dev default (`dev-insecure-secret-change-me`) with only a log warning. A deployment that forgets the env var mints forgeable tokens.
  - `GET /health/llm` is unauthenticated and makes a real provider call, so it is a free cost oracle for anyone who can reach the server.
- **Suggested resolution:** Before deployment: restrictive CORS allow-list, per-user quotas and rate limits, request-size caps, provider-budget monitoring, fail-fast (not warn) on a missing `JWT_SECRET_KEY`, and auth on `/health/llm`.

### SYS-003 — Background task can repeat the daily notification

- **Status:** RESOLVED (2026-07-23) — DailyTimelineService now owns notification dedup via a shared `last_daily_notification_date` app_meta key; the background task consults the same key; DailyResetService deleted.
- **Priority:** P1
- **Area:** `mobile/src/core/backgroundTasks.ts`, `mobile/src/data/services/DailyResetService.ts`, `mobile/src/data/services/DailyTimelineService.ts`
- **Current behavior:** The background task checks `last_quest_reset_date`. The current campaign timeline no longer calls `DailyResetService.checkAndReset()` or writes that key, so it normally remains absent. Each eligible background run can therefore send `[Daily Quest has arrived.]` again.
- **Why it matters:** The app can notify more than once per day and operates two competing day-transition concepts: the old reset service and the new timeline service.
- **Suggested resolution:** Make `DailyTimelineService` the single owner of day advancement and notification deduplication. Store and compare one canonical `last_notification_date` (or reuse the timeline cursor), then remove or migrate the old reset service.

### SYS-004 — Hunter Rank is not implemented

- **Status:** RESOLVED (2026-07-23) — computeRank() implemented: level/completionRate/dungeonsCleared each score 0-3 points against documented thresholds; summed score maps E->S.
- **Priority:** P1
- **Area:** `mobile/src/data/services/RankService.ts`
- **Current behavior:** `computeRank()` calculates `completionRate`, discards it, and always returns `E-Rank`.
- **Why it matters:** Level, completed days, and dungeon clears cannot affect the visible rank despite the rest of the app persisting and refreshing it.
- **Suggested resolution:** Define transparent rank thresholds using level, campaign completion rate, and cleared dungeons; add deterministic unit tests for each rank boundary.

### SYS-005 — Reward progression is flat for D through A quests

- **Status:** RESOLVED (2026-07-23) — Monotonic D-A odds filled between the E and S anchors (noReward 0.55->0.08, legendary 0.02->0.28); all distributions sum <= 1.
- **Priority:** P1
- **Area:** `mobile/src/data/services/RewardService.ts`
- **Current behavior:** Drop odds are implemented only for E and S. D, C, B, and A silently use E odds.
- **Why it matters:** Mid-rank quests do not receive the intended better reward chance or rarity curve, so the difficulty/reward contract is misleading.
- **Suggested resolution:** Fill in monotonic odds for D–A, validate every distribution, and test seeded/controlled rolls at each boundary.

### SYS-006 — Offline nutrition fallback is unfinished

- **Status:** RESOLVED (2026-07-23) — computeProteinTarget() implements the documented BMI-band formula with input validation and a capped training-load bonus.
- **Priority:** P1
- **Area:** `mobile/src/data/services/NutritionService.ts`
- **Current behavior:** `computeProteinTarget()` is a documented TODO that always returns `null`; consequently, local nutrition advice cannot be produced when the backend is unavailable.
- **Why it matters:** This feature violates the app's offline-first promise and exposes a calibration-pending state instead of useful guidance.
- **Suggested resolution:** Implement the formula documented in the source, validate height/weight inputs, and unit-test the BMI bands and training-load adjustment.

### SYS-007 — Local profile updates have no reconciliation contract

- **Priority:** P2
- **Area:** `mobile/src/presentation/stores/usePlayerStore.ts`, `mobile/src/core/useAppBootstrap.ts`
- **Current behavior:** Bio, aspirations, and model-preference saves are persisted locally when the profile API call fails, but the code only comments that they will sync later. There is no queued profile mutation or reconnect replay; reconnect only reloads inventory. Current reward and campaign requests already send most required context directly, so this does not normally break the personal app today.
- **Why it matters:** The profile endpoint's purpose is ambiguous: it is both legacy mock state and a purported remote context store. The current behavior is easy for a future feature to misunderstand and rely on incorrectly.
- **Suggested resolution:** Either make every AI endpoint self-contained and remove the expectation of profile sync, or implement a SQLite-backed profile sync queue replayed on connectivity restoration.

### SYS-008 — Legacy mutation queue and legacy API reads are unused

- **Priority:** P2
- **Area:** `mobile/src/data/database/MutationQueue.ts`, `mobile/src/data/datasources/ApiDataSource.ts`, `mobile/src/presentation/stores/useQuestStore.ts`
- **Current behavior:** `MutationQueue` defines only `COMPLETE_QUEST`, but no current code pushes or replays entries. `replayPendingMutations()` is a no-op. `getQuests()` and `getInventory()` API methods remain although current gameplay reads local SQLite.
- **Why it matters:** The code and older documentation imply an offline replay guarantee that the current campaign architecture does not provide. It increases maintenance surface and causes design confusion.
- **Suggested resolution:** Choose one design: remove the obsolete queue/endpoints and document immediate static fallback rewards, or revive a well-defined queue that reconciles an AI-generated reward without duplicating local rewards.

### SYS-009 — Campaign persistence is not atomic

- **Status:** RESOLVED (2026-07-23) — New IGoalRepository.saveCampaign() writes goal + quests in one SQLite transaction; timeline cursor moves only after commit.
- **Priority:** P2
- **Area:** `mobile/src/presentation/stores/useGoalStore.ts`
- **Current behavior:** `persistCampaign()` saves the goal and its generated quests in separate repository calls. The goal record can exist without its quest set if the second operation fails or the app stops between calls.
- **Why it matters:** A partially persisted campaign is difficult for the user to repair and may permanently appear as an active campaign with no daily work.
- **Suggested resolution:** Add a repository/service method that writes the goal and all quests in one SQLite transaction, then write the timeline cursor only after that transaction commits.

### SYS-010 — Bootstrap errors can leave the app indefinitely on the loading screen

- **Status:** RESOLVED (2026-07-23) — boot() wrapped in try/catch/finally; useAppBootstrap returns { ready, error }; App.tsx shows a [System Error.] recovery screen.
- **Priority:** P2
- **Area:** `mobile/src/core/useAppBootstrap.ts`, `mobile/App.tsx`
- **Current behavior:** `boot()` awaits database/store work without a top-level `try/catch/finally`. A failed local load, migration, or timeline tick prevents `ready` from being set and no recoverable error is displayed.
- **Why it matters:** A local database or migration problem looks like a hung app rather than an actionable failure.
- **Suggested resolution:** Capture startup errors in bootstrap state, show a System-style recovery screen, log diagnostic detail in development, and always finish the loading transition intentionally.

### SYS-011 — API timeout messages report the wrong duration

- **Status:** RESOLVED (2026-07-23) — Timeout message now reports error.config.timeout (the effective per-request timeout).
- **Priority:** P2
- **Area:** `mobile/src/data/datasources/ApiDataSource.ts`
- **Current behavior:** Generation calls override the default 10-second Axios timeout (up to four minutes), but the interceptor always says the request timed out after `ENV.REQUEST_TIMEOUT_MS` (10 seconds).
- **Why it matters:** Users and developers receive misleading diagnosis precisely when long AI work fails.
- **Suggested resolution:** Read the effective timeout from `error.config.timeout` and expose a user-friendly generation-specific error where appropriate.

### SYS-012 — Application lifecycle effect has stale dependency warnings

- **Status:** RESOLVED (2026-07-23) — Bootstrap effect reads store actions via getState() at call time; the empty dependency list is now honest.
- **Priority:** P2
- **Area:** `mobile/src/core/useAppBootstrap.ts`
- **Current behavior:** The bootstrap effect has an empty dependency list while it closes over six Zustand actions. ESLint reports this as an exhaustive-deps warning.
- **Why it matters:** The current store action identities are probably stable, but the intended lifetime is implicit and future store refactors can introduce stale closures.
- **Suggested resolution:** Use stable store access (`getState`) inside the effect, or include stable action dependencies after verifying they do not cause repeated bootstraps.

### SYS-013 — Lint is failing: 42 errors and 7 warnings

- **Status:** RESOLVED (2026-07-23) — All 42 errors and 7 warnings fixed (useAnimatedValue, key-based modal resets, useItem->redeemItem rename, escaped JSX apostrophes, module-level star field); only two narrowly justified eslint-disable lines remain (live clock, axios.create).
- **Priority:** P1
- **Area:** mobile lint baseline
- **Current behavior:** `cd mobile && npm run lint` fails. TypeScript currently passes, but lint cannot be used as a CI gate.
- **Exact findings:**
  - `GymHoursModal.tsx:32` and `ProteinCalcModal.tsx:47`: synchronous `setState` inside effects.
  - `LevelUpText.tsx`: ref access during render and synchronous effect state updates.
  - `SpaceBackground.tsx`: repeated ref access during render, `Math.random()` during render, and an unused `STAR_COLORS` constant.
  - `useElapsed.ts:18`: `Date.now()` during render.
  - `InventoryScreen.tsx:51`: the Zustand action is named `useItem`, so the hooks rule treats its invocation as an invalid hook call.
  - `ItemDetailModal.tsx`, `CampaignScreen.tsx`, and `QuestsScreen.tsx`: unescaped apostrophes in JSX.
  - `useAppBootstrap.ts`, `ApiDataSource.ts`, and `NutritionService.ts`: the seven warnings described by the lint output.
- **Suggested resolution:** Fix the genuine naming/purity issues first, then decide whether animation patterns need refactoring or narrowly justified lint configuration. Do not simply disable the full React ruleset.

### SYS-014 — No automated test suite covers the engine

- **Priority:** P1
- **Area:** repository-wide
- **Current behavior:** No test/spec configuration or test files were found.
- **Why it matters:** Timeline penalties, level thresholds, dungeon keys, rank thresholds, date boundaries, and fallback behavior are all stateful and easy to regress.
- **Suggested resolution:** Add a lightweight TypeScript test runner and begin with pure services (`RankService`, nutrition, reward odds, date utilities), then repository tests using a test SQLite database and API-service tests for fallback behavior.

### SYS-015 — Production API URL is not configured

- **Status:** PARTIALLY RESOLVED (2026-09-12) — the mechanism exists; the value does not.
- **Priority:** P2 — deploy blocker
- **Area:** `mobile/src/core/env.ts`, `mobile/eas.json`
- **Resolved:** The hardcoded placeholder is gone. Release builds read `EXPO_PUBLIC_API_URL` (inlined at bundle time) and `env.ts` throws at startup if it is missing, rather than silently treating every request as offline. Local-device setup is separated from release settings.
- **2026-10-31 update:** `eas.json` now has `env.EXPO_PUBLIC_API_URL` on `preview` (Cloud Run APK), a new `preview-vercel` profile (Vercel APK), and `production`. Values are `REPLACE-WITH-…` placeholders, which `env.ts` rejects at startup, so a build made before deploy fails loudly instead of running offline. Android package renamed to `com.sahildevhk.systemos`.
- **Still open:** Replace the placeholders with the real Cloud Run and Vercel URLs once the backend is deployed.
- **Suggested resolution:** Deploy the backend, then add `env.EXPO_PUBLIC_API_URL` to the `preview` and `production` profiles in `eas.json`.

### SYS-016 — Documentation describes retired Flutter and legacy reward models

- **Status:** RESOLVED (2026-09-12) — all documentation rewritten against the current code.
- **Priority:** P1
- **Area:** `README.md`, `CLAUDE.md`, `docs/*`
- **Original behavior:** Documents referred to Flutter, Drift, Dart, stat-modifier equipment, aspiration-generated daily quests, a `POST /api/quests/generate` route that does not exist, and a stateless account-free backend.
- **What changed:**
  - `docs/DOMAIN_MODELS.md` rewritten from Dart/Drift to the actual TypeScript models.
  - `docs/DATABASE_ARCHITECTURE.md` now covers all 12 device tables plus the backend's `users` / `user_state`, with current columns and migrations.
  - `docs/REWARD_SYSTEM.md` and `docs/AI_PROMPTS.md` rewritten for the coupon model and all five live agents.
  - `README.md` rewritten: correct feature set, auth-bearing backend, real API surface, iOS + Android dev-client setup, and an explicit "Not yet implemented" section.
  - `CLAUDE.md` corrected (wrong route list, wrong store count, wrong provider priority, wrong React Navigation version, stale stateless-backend claim).
- **Follow-up:** Documentation now asserts that code is canonical. Keep docs updated in the same change as the behavior they describe.

### SYS-017 — Offline-first scope needs a precise product definition

- **Priority:** P3 — clarification required
- **Area:** campaign creation and first-run initialization
- **Current behavior:** Once initialized, local campaign progress, quest completion, rewards, training, and timeline evaluation work locally. However, first-run player seeding and AI campaign creation require connectivity.
- **Why it matters:** “Offline-first” can be read as “everything works offline from a fresh install,” which is not currently true.
- **Suggested resolution:** Decide and document the intended promise: “offline after initial setup,” or provide a local first-run player and deterministic offline campaign generator.

### SYS-018 — Engine correctness sweep

- **Status:** RESOLVED (2026-11-01), except the Hunter Log credit policy (still open, below).
- **Priority:** P1
- **Fixed:**
  - Double-tapping complete on a quest or dungeon paid XP and loot twice. An in-flight id guard in `useQuestStore` now blocks the repeat.
  - `addExperience` wrote the whole player row from memory (`INSERT OR REPLACE`), which could roll back keys and rank that the timeline had written. It now uses `PlayerRepository.saveProgress()`, which updates only level, XP and stats.
  - Today's quests were sorted alphabetically by rank (A…E, S). They now sort by the E → S ladder.
  - Campaigns never left `active`, so a finished campaign held one of the 3 slots forever. `DailyTimelineService.tick()` now marks a campaign `completed` once its end date has passed, and Hunter Rank still counts completed campaigns.
  - SCRAM left `penalty_notice_date` behind.
  - Backend: goal-mode reward completions were appended to the server inventory blob, which nothing reads. It grew without limit. An unknown `rarity` also reached the reward prompt unchanged.
- **Still open:** `computeTaskCredit()` in `useTaskLogStore.ts` gives full XP with no daily cap (it is still a placeholder).
- **Known, deliberate:** Settings → Daily reset clears today's completions, so the same quests can be completed again for XP and loot again. This is a dev affordance; gate it before release.

### SYS-019 — Kotodama: open items

- **Priority:** P2
- **Area:** `games/kotodama/`, `mobile/src/presentation/screens/KotodamaScreen.tsx`
- **State (2026-11-01):** Arc 1 (hiragana), Arc 2 (katakana + 60 loanwords), Arc 3 (106 N5
  kanji + 102 N5 words) and Arc 4 (133 N4 kanji + 105 N4 words + 30 sentences) are playable
  in the standalone web build. Arc 1's title, hero select, overworld, dialogue, encounters,
  battles, purify and recruit, defeat, and save/reload were verified by a Playwright
  playthrough. Arc 2 was verified from seeded saves: ferry → Frost Harbor → Runa → a Mirror
  battle → purifying a Norse spirit, and the Skald's word trial with meaning and spell
  prompts. Arc 3 was verified from seeded saves: Runa's voyage → Castle Town → a kanji battle →
  purifying a spirit by typing a reading of 土, and the Shadow Shogun's mock exam. Arc 4 was
  verified from seeded saves: the Shogun's send-off → the foothills → a battle with sentence
  prompts → purifying a snow woman by typing a reading of 待, and the Tengu King's mock exam.
  The core has 126 Vitest tests, including a map validator, a boss-pacing simulation over all
  22 bosses, and data checks on every kanji reading, word and sentence.
- **Open:**
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
  - Full playthroughs of Arcs 2–4 have not been run end to end; their maps, story gates and
    boss balance are covered by the core tests.
  - The N5 and N4 kanji, vocabulary and sentences were written by hand (no dictionary data
    could be downloaded).
    The tests catch structural mistakes (wrong script, untaught kanji, duplicate meanings) but
    not a factually wrong reading or an unnatural sentence: a native-speaker review of
    `kanji.ts`, the vocabulary in `words.ts` and `sentences.ts` is worth doing.
  - Arc 5 (N3) is not written.

## Validation baseline

| Check | Result |
|---|---|
| `cd mobile && npx tsc --noEmit` | Passes |
| `./backend/venv/bin/python -m compileall -q backend/app` | Passes |
| `cd mobile && npm run lint` | Passes (0 errors, 0 warnings) as of 2026-07-23 |
| Automated tests | SystemOS: none. `npm run test --workspace @kotodama/core`: 126 passing |

## Recommended implementation order

1. Consolidate day/timeline handling and stop duplicate background notifications.
2. Finish rank, reward-progression, and local nutrition mechanics.
3. Establish a clean lint baseline and introduce tests for pure engine logic.
4. Make campaign writes atomic and bootstrap failures recoverable.
5. Decide the offline sync contract; remove dead legacy code or implement it fully.
6. Before any deployment beyond personal local use, close the remaining halves of SYS-002 (CORS, rate limits, provider budget, `JWT_SECRET_KEY` fail-fast) and SYS-015 (`EXPO_PUBLIC_API_URL` in `eas.json`).
