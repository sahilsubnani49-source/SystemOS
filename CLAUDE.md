# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## Project Overview

SystemOS is a local-first personal growth app with RPG mechanics (inspired by Solo
Leveling). The player states a goal and a timeline; AI agents plan it and lay out dated
daily quests. Completing quests earns XP, levels, Hunter Rank, and real-world reward
coupons. Device-side SQLite is the source of truth for gameplay state.

**Core principle**: the engine is permanent. The UI, backend, and AI provider are all
replaceable.

The repo also contains **Kotodama** (`games/kotodama/`), a Japanese-learning RPG that
SystemOS opens from the Stats tab and that also ships as its own app. See
[`games/kotodama/README.md`](games/kotodama/README.md).

**Before changing behavior in an area, read [`issue.md`](issue.md)** — it records known
gaps, dead subsystems, and deploy blockers, and prevents "fixing" something that is
deliberately unfinished.

---

## Tech Stack

- **Monorepo**: npm workspaces (`mobile`, `games/kotodama/*`), one root `package-lock.json`.
  Expo SDK 56 configures Metro for workspaces automatically: no `metro.config.js`.
- **Frontend**: Expo SDK 56, React Native 0.85, React 19.2, TypeScript 6 — `mobile/`
- **Graphics**: `@shopify/react-native-skia` + `react-native-reanimated` (Kotodama and the
  Stats-tab portal). These are native modules, so the dev client must be rebuilt after pulling them.
- **Backend**: FastAPI (Python 3.12+) — `backend/`
- **Device DB**: SQLite via `expo-sqlite` (WAL, singleton connection)
- **Backend DB**: SQLAlchemy Core (no ORM) — SQLite at `backend/systemos.db` locally,
  Neon Postgres in the cloud, chosen by `DATABASE_URL`
- **Backend config**: env vars only, validated in `backend/app/config.py`
- **Hosting**: Google Cloud Run (`backend/Dockerfile`) and Vercel (`backend/vercel.json`),
  both against the same Neon database — see [`docs/DEPLOYMENT_PLAN.md`](docs/DEPLOYMENT_PLAN.md)
- **State**: Zustand 5
- **Routing**: React Navigation 7 (native stack + bottom tabs)
- **HTTP**: axios with request/response interceptors
- **Auth**: PyJWT (HS256) + bcrypt
- **AI orchestration**: LangChain Core + LangGraph
- **Notifications / background**: expo-notifications, expo-background-fetch, expo-task-manager

> **Expo SDK 56 changed things.** Read the versioned docs at
> <https://docs.expo.dev/versions/v56.0.0/> before writing Expo code. Expo Go cannot load
> SDK 56 — development requires a dev client build.

---

## Commands

### Mobile (`mobile/`)

```bash
npm install            # from the REPO ROOT: installs every workspace
cd mobile

# Dev client build (required once; Expo Go will not work)
cd ios && pod install && cd .. && npx expo run:ios   # iOS
npx expo run:android                                 # Android (needs JAVA_HOME=openjdk@17)

# Fast path after that — no rebuild
npx expo start --dev-client    # then press i or a

npm run lint
npm run lint:fix
npm run format
npx tsc --noEmit
```

Re-run `expo run:*` only when native code, native deps, or `app.json` change.

### Backend (`backend/`)

```bash
# Virtualenv lives at backend/venv (create once: python3 -m venv backend/venv)
# Use `python -m pip` — the repo path contains spaces, which breaks pip's shebang.
backend/venv/bin/python -m pip install -r backend/requirements.txt

cd backend && ./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Connecting the app to the backend

`mobile/src/core/env.ts` → `PHYSICAL_DEVICE_IP`: `localhost` (iOS Simulator),
`10.0.2.2` (Android emulator), or the machine's LAN IP (physical device). Setting
`EXPO_PUBLIC_API_URL` overrides that in any build. Release builds read it from the
`eas.json` profile: `preview` (Cloud Run APK), `preview-vercel` (Vercel APK),
`production` (Play Store bundle). Until the backend is deployed these hold
`REPLACE-WITH-…` placeholders, which `env.ts` rejects at startup (SYS-015).

```bash
cd mobile && eas build -p android --profile preview          # Cloud Run APK
cd mobile && eas build -p android --profile preview-vercel   # Vercel APK
```

Backend database calls are `async` (`await db.get_user_state(...)`) — the blocking query
runs in a worker thread. Never import a DB driver or open a connection at module
import time: Vercel's filesystem is read-only.

---

## Architecture

### Layered frontend (strict unidirectional dependency)

```
Presentation  (screens + components + Zustand stores)
      ↓
Domain        (TypeScript interfaces + repository contracts)
      ↓
Data          (expo-sqlite repositories + axios datasource + services)
```

- **Domain** (`src/domain/`) has zero external dependencies — no React Native, SQLite,
  Axios, or Expo imports.
- **Data** (`src/data/`) implements domain contracts. Repositories talk to SQLite;
  `ApiDataSource` talks to the backend.
- **Presentation** (`src/presentation/`) reads Zustand stores only — **never** call a
  repository from a screen.

### Navigation

Six bottom tabs: Dashboard, Campaign, Quests, Stats, Army (training), Settings.
Inventory and TaskDetail push over them as stack screens. `AppNavigator` is a
**declarative auth gate** — it swaps which screens are registered based on
`useAuthStore.status`, so login/logout never calls `navigate()` imperatively.

### Bootstrap sequence (`src/core/useAppBootstrap.ts`)

```
App launch
  → useAuthStore.initialize()          ← resolve session FIRST
  → request notification permissions
  → schedule 8am daily quest reminder
  → register background fetch task
  → if loggedIn: load 7 stores in parallel
      (player, quest, goal, inventory, training, timeLog, taskLog)
  → DailyTimelineService.tick() → refresh player/quest/goal/inventory

Auth flips to loggedIn  →  loadData() once per session
App foreground resume   →  advanceTimeline() + reconcile running timer
Device back online      →  refresh inventory
```

**No `/api/*` call may fire while logged out** — they would 401 without a token. Every
network path in bootstrap is guarded on `status === 'loggedIn'`.

### Backend

Not stateless. `app/auth.py` provides JWT auth (30-min access, 30-day refresh, bcrypt
passwords); `app/db.py` persists `users` and `user_state` in SQLite. Per-user state is
read and written via `db.get_user_state()` / `db.save_user_state()` — the `DEFAULT_*_STATE`
dicts in `main.py` are **seed templates only**, deep-copied at signup, never shared
mutable state.

Every `/api/*` route requires `Depends(get_current_user)`.

Gameplay state still lives on the device. The backend copy is a profile/seed store.

### AI services (`backend/app/services/`)

All follow the same LCEL shape:

```
ChatPromptTemplate (system + few-shot)
  | _get_llm(model_preference)     ← shared provider factory
  | JsonOutputParser(pydantic_object=OutputSchema)
```

| Agent | Service | Route |
|---|---|---|
| Quest Master (strategy) | `quest_generator.py` | `POST /api/goals/strategy` |
| Quest Master (campaign) | `quest_generator.py` | `POST /api/goals/plan` |
| Gatekeeper (dungeon) | `quest_generator.py` | `POST /api/dungeons/generate` |
| Architect (reward) | `reward_generator.py` | `POST /api/quests/{id}/complete` |
| Nutritionist | `nutrition_advisor.py` | `POST /api/nutrition/protein` |
| Architect (task line) | `task_describer.py` | `POST /api/tasks/describe` |

**Provider priority** (cloud): Groq → xAI Grok → Gemini → Anthropic → OpenAI — first key
present wins. Local mode uses Ollama. `_get_llm()` lives **exclusively** in
`reward_generator.py`; import it, never redefine it.

Every route except `/api/goals/strategy` has a deterministic fallback and returns HTTP
200 with `ai_generated: false` on LLM failure. Strategy deliberately has none — a
fabricated plan is worse than an honest failure.

### Campaign flow

```
Campaign screen: goal + context + duration + quests/day
  → POST /api/goals/strategy      → prose plan, previewed/revised in memory
  → POST /api/goals/plan          → LangGraph: strategize → structure in weekly batches
  → useGoalStore persists goal + dated quests to SQLite
  → quests surface only when scheduled_for === today
```

### Reward flow

```
Quest completed
  → device rolls rarity from quest rank (RewardService.rollRewardRarity)
  → no drop → XP only
  → drop → POST /api/quests/{id}/complete with the rolled rarity
      → AI coupon, or backend rule-based fallback
  → backend unreachable → device static fallback table
  → write to dynamic_items, refresh player + rank
```

The **device owns the roll** so the rarity is identical online and offline. Rewards are
real-world indulgence coupons (`token` / `potion`), never stat gear.

### Timeline, keys, penalties

`DailyTimelineService` evaluates fully elapsed campaign days on boot and foreground. A
day where every scheduled quest is complete increments `Goal.daysCompleted`. Every 21
completed days awards a key and schedules a mock-exam dungeon. If an evaluated day has
unfinished quests, current reward items are cleared as the penalty.

`DailyTimelineService` is the **single owner** of day advancement and notification
dedup, via the `last_daily_notification_date` key in `app_meta`. (The old
`DailyResetService` was deleted — don't reintroduce a second day-transition concept.)

---

## Database

Device tables are in `mobile/src/data/database/schema.ts`, opened via `db.ts`.

| Table | Purpose |
|---|---|
| `players` | Singleton Hunter: 8 stats, level/XP, bio, aspirations, rank, keys |
| `goals` | Campaigns: timeline bounds, plan, schedule, completed-day counter |
| `quests` | Dated campaign quests + dungeon quests, acceptance and completion state |
| `dynamic_items` | Reward coupons (`token` / `potion` / legacy `weapon`) |
| `training_exercises` | Baselines, progression targets, completion history |
| `gym_sessions` | Self-reported gym hours, keyed by date |
| `time_logs` | Focus-timer sessions — `ended_at IS NULL` **is** the running timer |
| `task_categories` | Hunter Log buckets (name + emoji); 3 seeded on first launch. `source` links a bucket to another subsystem's time |
| `task_sessions` | Hand-entered time against a category |
| `app_meta` | Key-value app state — created lazily by `AppMeta.ts` |
| `mutation_queue` | Offline replay queue — created lazily, **currently unused** (SYS-008) |
| `shadow_soldiers` | **Dead schema** — no repository, store, model, or UI |

Backend tables (`backend/app/db.py`): `users`, `user_state` (JSON TEXT blobs).

See [`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md) for columns.

---

## Key conventions

- **Quest difficulty**: E → S, mapped to time commitment (E ≈ 1 hr … S ≈ 12 hrs). There
  is **no level cap on rank** — a level-1 player may receive an S-rank quest.
- **Item rarity**: Common → Rare → Epic → Legendary; scales how generous the indulgence is.
- **Stats**: 8 attributes, all start at 10, +1 each on level-up.
- **Level-up**: `experienceToNextLevel *= 1.5`.
- **Hunter Rank**: `RankService.computeRank()` scores level, completion rate, and
  dungeons cleared 0–3 each; the sum maps E → S.
- **JSON columns**: `dungeon_challenge`, `dungeon_result`, `stat_modifiers`,
  `special_effect`, `mutation_queue.payload` are `JSON.stringify`'d TEXT, parsed in
  repository `rowTo*` mappers.
- **API casing**: FastAPI returns snake_case; `ApiTypes.ts` types the wire shapes and
  `api*ToDomain` mappers convert to camelCase. No snake_case key escapes the data layer.
- **Notifications**: Solo Leveling system style — `[Quest Complete.]`, `[Level Increased.]`.
- **Background task**: `TaskManager.defineTask` must run at module level before any
  component mounts — this is why `index.ts` imports `src/core/backgroundTasks.ts` directly.
- **Migrations**: additive `ALTER TABLE … ADD COLUMN` in `db.ts`, wrapped in try/catch
  (SQLite has no `IF NOT EXISTS` for columns). **Never write a destructive migration** —
  the device holds the only copy of a user's progress.
- **Focus timer**: elapsed is always derived from `startedAt`, never stored or ticked.
  Keep it that way — it's what makes a session survive app kill and backgrounding.
- **The Hunter Log is a read-time view over three tables** (`task_sessions`,
  `gym_sessions`, `time_logs`), merged in `useTaskLogStore.refreshSummary()`. Each
  subsystem awards its own XP where the time is recorded, so **never copy rows between
  them** — a write-through pays XP twice. Add new time sources by giving a category a
  `source`, or by appending a synthetic summary row.
- **`MAX_DESCRIPTION_CHARS = 80`** in `task_describer.py` must stay in sync with
  `CampaignTaskService.ts`. Press Start 2P is a very wide pixel face; keep generated
  text ASCII (an em-dash risks tofu).
- **Tab labels** must stay ≤6 chars at 7pt — Press Start 2P glyphs are ~1em wide and
  longer labels truncate.

---

## Documentation

| Document | Contents |
|---|---|
| [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) | Code layout, layering, main flows |
| [`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md) | Every table and column |
| [`docs/DOMAIN_MODELS.md`](docs/DOMAIN_MODELS.md) | TypeScript models + Pydantic schemas |
| [`docs/REWARD_SYSTEM.md`](docs/REWARD_SYSTEM.md) | Coupon model, drop odds, fallbacks |
| [`docs/AI_PROMPTS.md`](docs/AI_PROMPTS.md) | Each agent's prompt and output schema |
| [`issue.md`](issue.md) | Active issues and deploy blockers |

When code and docs disagree, the code wins — and update the doc.

### Kotodama (`games/kotodama/`)

```bash
npm run test --workspace @kotodama/core        # the repo's only automated tests
cd games/kotodama/app && npx expo run:android  # standalone app (or run:ios / npm run web)
```

- **Boundary rule:** nothing under `games/` may import from `mobile/`. SystemOS renders
  `<KotodamaGame onExit onStudySession />` (`KotodamaScreen.tsx`) and receives study
  sessions back; `useTaskLogStore.recordJapaneseSession` files them via `logSession`.
- The game keeps its own SQLite file (`kotodama.db`), never SystemOS's tables.
- `expo-asset` is pinned through a root `overrides` entry: `expo-audio`'s loose range
  otherwise resolves the SDK 58 build, which breaks the Metro bundle.

## Not implemented

No skill trees, achievements, titles, boss raids, memory/vector DB, analytics
(streaks/heatmaps), voice, wearables, multiplayer, or Shadow Army. **SystemOS itself has
no test suite** (SYS-014); only `@kotodama/core` has Vitest tests. Don't document these
as existing. SystemOS does not run on web.
