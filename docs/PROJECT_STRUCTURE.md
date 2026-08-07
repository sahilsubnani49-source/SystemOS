# SystemOS Project Structure

SystemOS is a personal-growth RPG built as an **Expo / React Native** application
with a **FastAPI** AI-generation backend. The device-side SQLite database is the
durable source of truth for player progress. The backend is currently a local
development service that generates AI content; it is not a multi-user persistence
service.

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
├── backend/                        # FastAPI AI-generation service
│   ├── app/main.py                 # App setup, request models, and HTTP endpoints
│   ├── app/services/               # LLM provider factory and generation workflows
│   ├── requirements.txt            # Python/LangChain dependencies
│   └── .env.example                # Local provider configuration template
├── docs/                           # Current architecture and product documentation
├── web/                            # Standalone web prototype/static experiment
├── README.md                       # Product overview and development entry point
├── AGENTS.md                       # Repository guidance for coding agents
└── issue.md                        # Active technical issue register
```

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

- `models/` contains `Player`, `Goal`, `Quest`, `DynamicItem`,
  `TrainingExercise`, and `GymSession`.
- `repositories/` declares repository contracts for player, goal, quest, inventory,
  and training data.

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

- `screens/` contains the tab screens and inventory stack screen.
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
| `shadow_soldiers` | Legacy habit/Shadow Army data |
| `training_exercises` | Training baselines, progression targets, and completion history |
| `gym_sessions` | Gym-hours records and awarded XP |

`app_meta` and `mutation_queue` are lazily created by their owning services rather
than by the core schema. There are currently no SQLite foreign-key constraints;
relationships such as `goals → quests` are maintained by repository/service code.

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
setup, and route handlers. AI workflows live in `backend/app/services/`:

- `reward_generator.py` contains the shared `_get_llm()` provider factory and the
  Architect reward generator.
- `quest_generator.py` imports that provider factory and implements the Quest Master
  strategy, campaign, and dungeon workflows, with deterministic fallbacks.
- `nutrition_advisor.py` provides AI nutrition guidance and a deterministic fallback.

The backend supports these route groups:

| Route group | Purpose |
|---|---|
| `GET /health`, `GET /health/llm` | Backend and configured-provider diagnostics |
| `GET/POST /api/profile` | Legacy/local-development seed and profile context |
| `GET /api/quests`, `POST /api/quests/{id}/complete`, `POST /api/quests/reset` | Legacy endpoints plus reward generation |
| `POST /api/goals/strategy`, `POST /api/goals/plan` | Campaign strategy and campaign generation |
| `POST /api/dungeons/generate` | On-demand dungeon content |
| `POST /api/nutrition/protein` | Nutrition recommendation |

The backend uses LangChain/LangGraph and selects a provider from local Ollama or the
configured cloud keys. It has module-level mock state for local development and must
not be treated as a multi-user production backend without the work tracked in
`issue.md`.

## Development commands

```bash
# Mobile app
cd mobile
npm install
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

For a physical device, set `PHYSICAL_DEVICE_IP` in `mobile/src/core/env.ts` to the
development machine's LAN address. A release build needs separate API configuration;
the current production URL is intentionally only a placeholder.

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

This document is current as of the goal-driven campaign implementation. The database
and domain-model documents still contain legacy Flutter and equipment-model material;
do not use them as implementation instructions until they are updated.
