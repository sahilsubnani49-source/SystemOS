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

- **Priority:** P0 — deploy blocker
- **Area:** `backend/app/main.py`
- **Current behavior:** `player_state`, `quests_state`, and `inventory_state` are module-level Python variables. Profile updates, legacy quest completions, and inventory reads mutate or expose that one shared state.
- **Why it matters:** This is acceptable only while one person runs the backend locally. If deployed, every caller would share a profile and inventory; a restart also loses all state. It contradicts the intended stateless-backend/local-source-of-truth model.
- **Suggested resolution:** For the intended architecture, remove the legacy shared-state profile/quest/inventory routes and make AI endpoints pure request-to-response functions. If a future multi-user product needs remote persistence, introduce authenticated per-user storage explicitly.

### SYS-002 — AI endpoints have no access control, rate limiting, or cost guardrail

- **Priority:** P0 — deploy blocker
- **Area:** `backend/app/main.py`
- **Current behavior:** Any caller that can reach the server can request campaign, dungeon, nutrition, reward, and LLM-health generation. Cloud provider keys are paid/limited resources held by the backend.
- **Why it matters:** CORS is not authentication. A public backend could be abused to consume provider quota or generate unexpected cost.
- **Suggested resolution:** Keep the server local/private during development. Before deployment, add authentication, request/user quotas, rate limits, request-size limits, provider-budget monitoring, and a restrictive CORS allow-list.

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

### SYS-015 — Production API URL is a placeholder

- **Priority:** P2 — deploy blocker
- **Area:** `mobile/src/core/env.ts`
- **Current behavior:** Non-development builds use `https://your-production-api.com`.
- **Why it matters:** A release build cannot contact a real backend without a configuration change, and app configuration is coupled to a source edit.
- **Suggested resolution:** Use build-time environment configuration (for example EAS environment variables), validate it at startup, and keep local-device setup separate from release settings.

### SYS-016 — Documentation describes retired Flutter and legacy reward models

- **Priority:** P1
- **Area:** `docs/PROJECT_STRUCTURE.md`, `docs/DATABASE_ARCHITECTURE.md`, `docs/DOMAIN_MODELS.md`, portions of `README.md` and `AGENTS.md`
- **Current behavior:** Several documents refer to Flutter, Drift, Riverpod, stat-modifier equipment, and aspiration-generated daily quests. The live code is React Native/Expo, `expo-sqlite`, Zustand, real-world token/potion rewards, and goal-driven dated campaigns.
- **Why it matters:** Stale architecture instructions lead humans and LLMs to make incorrect changes.
- **Suggested resolution:** `docs/PROJECT_STRUCTURE.md` has been rewritten as the current orientation document. Update the remaining documents next, starting with database and domain-model descriptions, and treat source code as canonical until that work is complete.

### SYS-017 — Offline-first scope needs a precise product definition

- **Priority:** P3 — clarification required
- **Area:** campaign creation and first-run initialization
- **Current behavior:** Once initialized, local campaign progress, quest completion, rewards, training, and timeline evaluation work locally. However, first-run player seeding and AI campaign creation require connectivity.
- **Why it matters:** “Offline-first” can be read as “everything works offline from a fresh install,” which is not currently true.
- **Suggested resolution:** Decide and document the intended promise: “offline after initial setup,” or provide a local first-run player and deterministic offline campaign generator.

## Validation baseline

| Check | Result |
|---|---|
| `cd mobile && npx tsc --noEmit` | Passes |
| `./backend/venv/bin/python -m compileall -q backend/app` | Passes |
| `cd mobile && npm run lint` | Passes (0 errors, 0 warnings) as of 2026-07-23 |
| Automated tests | None found |

## Recommended implementation order

1. Consolidate day/timeline handling and stop duplicate background notifications.
2. Finish rank, reward-progression, and local nutrition mechanics.
3. Establish a clean lint baseline and introduce tests for pure engine logic.
4. Make campaign writes atomic and bootstrap failures recoverable.
5. Decide the offline sync contract; remove dead legacy code or implement it fully.
6. Before any deployment beyond personal local use, address SYS-001, SYS-002, and SYS-015.
