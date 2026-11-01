# SystemOS Project Structure

SystemOS is a personal-growth RPG built as an **Expo / React Native** application
with a **FastAPI** AI-generation backend. The device-side SQLite database is the
durable source of truth for player progress. The backend authenticates users and
generates AI content; it holds a per-user profile/seed copy but not the gameplay
record.

This document describes the code that exists today. For known gaps and deprecated
subsystems, see [`issue.md`](../issue.md).

## Repository layout

```text
SystemOS/
├── mobile/                         # Expo / React Native TypeScript application
│   ├── App.tsx                     # Root UI, font loading, bootstrap gate
│   ├── index.ts                    # Expo entry; imports background task definitions
│   ├── app.json                    # Expo native application configuration
│   ├── package.json                # Mobile dependencies and commands
│   └── src/
│       ├── core/                   # App-wide configuration and orchestration
│       ├── domain/                 # Framework-independent models and contracts
│       ├── data/                   # SQLite, HTTP, repository, and engine services
│       └── presentation/           # Screens, components, hooks, and Zustand stores
├── backend/                        # FastAPI auth + AI-generation service
│   ├── app/main.py                 # App setup, request models, and HTTP endpoints
│   ├── app/auth.py                 # JWT auth, password hashing, /auth router
│   ├── app/db.py                   # SQLite users + per-user state
│   ├── app/services/               # LLM provider factory and generation workflows
│   ├── requirements.txt            # Python/LangChain dependencies
│   └── .env.example                # Local provider configuration template
├── games/kotodama/                 # Japanese-learning RPG (see its README)
│   ├── core/                       # @kotodama/core: pure-TS rules, content, SRS, maps (Vitest)
│   ├── game/                       # @kotodama/game: React Native + Skia renderer, <KotodamaGame/>
│   └── app/                        # @kotodama/app: standalone Expo app shell
├── package.json                    # npm workspaces root (one lockfile for everything)
├── docs/                           # Current architecture and product documentation
├── web/                            # Standalone web prototype/static experiment
├── README.md                       # Product overview and development entry point
├── AGENTS.md                       # Repository guidance for coding agents
└── issue.md                        # Active technical issue register
```

SystemOS opens Kotodama from the Stats tab (`GatePortal` → `KotodamaScreen`, a
full-screen modal). Code under `games/` never imports from `mobile/`; study sessions come
back through `onStudySession` and are logged by `useTaskLogStore.recordJapaneseSession`.

## Mobile architecture

The mobile application uses a strict, one-way dependency direction:

```text
Presentation (screens, components, Zustand stores)
        ↓
Domain (TypeScript models and repository interfaces)
        ↓
Data (repositories, SQLite, network datasource, services)
        ↓
expo-sqlite / FastAPI AI endpoints
```

### `mobile/src/core/`

Cross-cutting application infrastructure:

- `navigation.tsx` defines the native stack and six bottom tabs: Dashboard,
  Campaign, Quests, Stats, Army/Training, and Settings.
- `useAppBootstrap.ts` requests notification permission, schedules reminders,
  registers background work, loads Zustand stores, and advances the campaign timeline.
- `backgroundTasks.ts` registers the Expo background task at module load time.
- `env.ts` defines the API base URL and local-development device settings.
- `network.ts`, `NotificationService.ts`, `dateUtils.ts`, `theme.ts`, and
  `constants.ts` support the rest of the app.

### `mobile/src/domain/`

Pure TypeScript definitions with no React Native, SQLite, Axios, or Expo imports.

- `models/` contains `Player`, `Goal`, `Quest`, `DynamicItem`, `TrainingExercise`,
  `GymSession`, `TimeLog`, and `TaskLog` (`TaskCategory` / `TaskSession`).
- `repositories/` declares repository contracts for player, goal, quest, inventory,
  training, time-log, and task-log data.

See [`DOMAIN_MODELS.md`](DOMAIN_MODELS.md) for the full model definitions.

### `mobile/src/data/`

Concrete data access and business services.

- `database/schema.ts` declares the core SQLite tables.
- `database/db.ts` opens the singleton `systemos.db` connection, enables WAL, creates
  tables, and applies additive migrations.
- `repositories/` maps SQLite rows to domain models and implements domain contracts.
- `datasources/ApiDataSource.ts` is the typed Axios boundary for the FastAPI service;
  `ApiTypes.ts` represents snake_case API payloads.
- `services/` contains app/game logic such as campaign timeline processing, dungeon
  scheduling, rank calculation, reward fallback, training progression, nutrition,
  diagnostics, and app metadata.

### `mobile/src/presentation/`

React Native UI and state coordination.

- `screens/` contains the six tab screens (Dashboard, Campaign, Quests, Stats,
  Training/Army, Settings), the Inventory and TaskDetail stack screens, and the
  Login/Signup screens behind the auth gate.
- `components/` contains reusable modals, quest/reward cards, visual effects, and
  system-dialog UI.
- `stores/` are Zustand state containers. They call repositories/services and expose
  presentation-friendly actions; screens should not call repositories directly.
- `hooks/` contains presentation-specific React hooks.

## Local data model

The SQLite database is a single-user, device-local store. Core tables are created in
`mobile/src/data/database/schema.ts`:

| Table | Current purpose |
|---|---|
| `players` | Singleton Hunter identity, eight stats, level/XP, bio, model preference, rank, and keys |
| `goals` | Active goal campaigns, their time range, strategy, schedule, and completed-day counter |
| `quests` | Dated daily campaign quests and dungeon quests, including completion and acceptance state |
| `dynamic_items` | Earned real-world reward coupons (`token`, `potion`, or legacy `weapon`) |
| `shadow_soldiers` | Dead schema — no repository, store, model, or UI reads it |
| `training_exercises` | Training baselines, progression targets, and completion history |
| `gym_sessions` | Gym-hours records and awarded XP, keyed by date |
| `time_logs` | Focus-timer sessions; a row with `ended_at IS NULL` is the running timer |
| `task_categories` | Hunter Log buckets on the Dashboard (name + emoji) |
| `task_sessions` | Hand-entered time logged against a category |

`app_meta` and `mutation_queue` are lazily created by their owning services rather
than by the core schema. There are currently no SQLite foreign-key constraints;
relationships such as `goals → quests` are maintained by repository/service code.

Full column-level detail is in [`DATABASE_ARCHITECTURE.md`](DATABASE_ARCHITECTURE.md).

## Main application flows

### Bootstrap and local-first behavior

1. `App.tsx` loads the pixel font and waits for `useAppBootstrap()`.
2. Bootstrap loads player, goals, today’s quests, inventory, and training state in
   parallel from local SQLite.
3. It advances the date-based timeline and refreshes affected stores.
4. A local player is used as-is; only a first run with no local player asks the backend
   for a seed profile.

The app is local-first after setup. AI campaign generation and first-run profile
seeding currently need connectivity; see `issue.md` for the exact offline scope.

### Goal campaign

1. The Hunter enters a goal, context, duration, and desired quests per day on the
   Campaign screen.
2. The optional strategy step calls `POST /api/goals/strategy` and keeps its editable
   draft in memory.
3. On direct forge or draft approval, `POST /api/goals/plan` returns a plan, schedule,
   and dated quests.
4. `useGoalStore` persists the campaign locally. Daily quests are shown only when
   their `scheduled_for` date is today.

### Quest completion and rewards

1. `useQuestStore` marks the local quest complete and applies local XP/level logic.
2. The device rolls reward rarity from the quest difficulty.
3. If a reward drops, the app attempts an AI reward request. A local static coupon is
   used when offline or when the request fails.
4. The resulting item is stored in local SQLite and the player/rank state is refreshed.

### Timeline, dungeon keys, and penalties

`DailyTimelineService` evaluates fully elapsed campaign days when the app boots or
returns to the foreground. For each active goal, a fully completed scheduled day
increments `daysCompleted`. Every 21 completed days awards a key and schedules a
mock-exam dungeon. If any evaluated campaign day has unfinished quests, all current
reward items are cleared as the configured penalty.

## Backend architecture

`backend/app/main.py` owns the FastAPI application, request validation models, CORS
setup, and route handlers. Authentication lives in `app/auth.py` and persistence in
`app/db.py`. AI workflows live in `backend/app/services/`:

- `reward_generator.py` contains the shared `_get_llm()` provider factory and the
  Architect reward generator.
- `quest_generator.py` imports that provider factory and implements the Quest Master
  strategy, campaign, and dungeon workflows, with deterministic fallbacks.
- `nutrition_advisor.py` provides AI nutrition guidance and a deterministic fallback.
- `task_describer.py` names the work on a running focus timer, with a template fallback.

The backend supports these route groups:

| Route group | Purpose |
|---|---|
| `POST /auth/signup`, `/auth/login`, `/auth/refresh`, `GET /auth/me` | JWT authentication |
| `GET /health`, `GET /health/llm` | Backend and configured-provider diagnostics |
| `GET/POST /api/profile` | Per-user seed and profile context |
| `GET /api/quests`, `POST /api/quests/{id}/complete`, `POST /api/quests/reset` | Seed quests plus reward generation |
| `POST /api/goals/strategy`, `POST /api/goals/plan` | Campaign strategy and campaign generation |
| `POST /api/dungeons/generate` | On-demand dungeon content |
| `POST /api/nutrition/protein` | Nutrition recommendation |
| `POST /api/tasks/describe` | Focus-timer task line |

Every `/api/*` route requires a Bearer access token via the `get_current_user`
dependency. Per-user state is persisted in `backend/systemos.db` (`users` and
`user_state` tables) and read/written through `db.get_user_state()` /
`db.save_user_state()` — there is no shared mutable module state.

The backend uses LangChain/LangGraph and selects a provider from local Ollama or the
configured cloud keys (Groq → xAI → Gemini → Anthropic → OpenAI). It is still not
hardened for public deployment: CORS allows all origins and there is no rate limiting
or provider-cost guardrail. See `issue.md` before exposing it to a network.

## Development commands

```bash
# All JS workspaces (SystemOS + Kotodama), from the repository root
npm install

# Mobile app
cd mobile
npm start
npm run ios
npm run android
npm run lint
npx tsc --noEmit
```

```bash
# Backend, from repository root
backend/venv/bin/python -m pip install -r backend/requirements.txt
cd backend && ./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`mobile/src/core/env.ts` resolves the API base URL: `localhost` for the iOS Simulator,
`10.0.2.2` for the Android emulator, and the machine's LAN address for a physical
device. Release builds instead read `EXPO_PUBLIC_API_URL`, inlined at bundle time from
the active `eas.json` profile — that variable is not configured yet, so a release build
throws at startup by design (SYS-015).

## Working conventions

- The device database is the source of truth for gameplay state.
- Domain code remains dependency-free; UI uses Zustand stores instead of repositories.
- FastAPI responses use snake_case; mapper functions translate to camelCase domain
  values at the data boundary.
- Quest ranks progress from E through S. Item rarities progress from Common through
  Legendary.
- Keep background-task definitions imported before React mounts (`mobile/index.ts`).
- Prefer additive SQLite migrations in `db.ts`; existing installations must not lose
  local progress.

## Documentation status

Current as of the auth + per-user-state backend. `DOMAIN_MODELS.md`,
`DATABASE_ARCHITECTURE.md`, `REWARD_SYSTEM.md`, and `AI_PROMPTS.md` were rewritten
against the same revision — the retired Flutter/Drift and stat-gear material is gone.

Where a document and the code disagree, the code wins. Known gaps are tracked in
[`issue.md`](../issue.md).
