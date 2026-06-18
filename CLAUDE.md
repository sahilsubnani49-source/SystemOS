# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SystemOS is a privacy-first, offline-first personal growth app with RPG mechanics (inspired by Solo Leveling). Users complete real-world quests to gain XP, level up, collect AI-generated items, and build habits ("Shadow Army"). All data is owned locally by the user.

**Core principle**: The engine is permanent. The UI, backend, and AI provider are all replaceable.

---

## Tech Stack

- **Frontend**: React Native (TypeScript) via Expo — `mobile/`
- **Backend**: FastAPI (Python) — `backend/`
- **Database**: SQLite via `expo-sqlite` (local, device-side)
- **State management**: Zustand
- **Routing**: React Navigation v6 (native stack + bottom tabs)
- **HTTP client**: axios with request/response interceptors
- **Notifications**: expo-notifications
- **Background tasks**: expo-background-fetch + expo-task-manager
- **AI providers**: Gemini, OpenAI, Claude, DeepSeek, Ollama (local) — called via backend

---

## Commands

### React Native Frontend (`mobile/`)

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server (then press i for iOS, a for Android, or scan QR with Expo Go)
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Lint
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

> **Physical device**: Edit `mobile/src/core/env.ts` and set `PHYSICAL_DEVICE_IP` to your machine's local network IP. The device and machine must be on the same Wi-Fi network.

### FastAPI Backend (`backend/`)

```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run (from repo root)
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend API routes:
- `GET /health`
- `GET /api/profile` — player stats + bio + aspirations
- `POST /api/profile` — update bio, aspirations, and model preference
- `GET /api/quests` — active quests
- `POST /api/quests/generate` — generate AI quests from player aspirations (Quest Master)
- `POST /api/quests/{quest_id}/complete` — complete quest, generate AI reward item
- `GET /api/inventory` — collected items
- `POST /api/quests/reset` — dev utility: reset all state

---

## Architecture

### Layered Frontend Architecture (strict unidirectional dependency)

```
Presentation  (screens + components + Zustand stores)
      ↓
Domain        (TypeScript interfaces + abstract repository contracts)
      ↓
Data          (expo-sqlite repositories + axios datasource + services)
```

- **Domain** (`src/domain/`) has zero external dependencies — pure TypeScript interfaces.
- **Data** (`src/data/`) implements domain contracts. Repositories talk to SQLite; `ApiDataSource` talks to the backend.
- **Presentation** (`src/presentation/`) reads from Zustand stores only; never touches repositories directly.

### Offline-First Flow

1. On every store `load()`, local SQLite is read first and shown immediately.
2. If online, the API is called and SQLite is updated with fresh data.
3. If offline, cached SQLite data is used silently.
4. Quest completions that fail due to no connectivity are queued in `MutationQueue` (SQLite-backed) and replayed automatically when the device comes back online. A static fallback reward is given immediately so the user never goes empty-handed.

### App Bootstrap Sequence (`src/core/useAppBootstrap.ts`)

```
App launch
  → request notification permissions
  → schedule 8am daily quest reminder
  → register background fetch task
  → load all 4 Zustand stores in parallel (player, quests, inventory, shadow)
  → daily reset check (new day → reset quests + fire notification)

App foreground resume  →  daily reset check
Device back online     →  replay MutationQueue → refresh stores
```

### FastAPI / AI Role

The backend is **stateless** — it holds no persistent data. Its two AI agents:

1. **The Architect** (`reward_generator.py`): `POST /api/quests/{id}/complete` generates a personalized `DynamicItem` using the player's bio + quest category.
2. **The Quest Master** (`quest_generator.py`): `POST /api/quests/generate` generates a full quest set from the player's bio + aspirations. Replaces `quests_state` in memory.
3. **Initial data seed**: On first launch (empty SQLite), the app fetches profile and quests from the API to seed local DB.

The app works fully offline without the backend. The backend is only required for AI-generated rewards and quest generation.

### AI Service Architecture (`backend/app/services/`)

Both AI services share the same LangChain LCEL pattern:
```
ChatPromptTemplate (system + few-shot examples)
  | _get_llm(model_preference)     ← shared provider factory
  | JsonOutputParser(pydantic_object=OutputSchema)
```

Provider priority (cloud mode): Anthropic → OpenAI → Gemini. Local mode uses Ollama.

`_get_llm()` lives in `reward_generator.py` and is imported by `quest_generator.py` — do not duplicate it.

### AI Quest Generation Flow

```
User writes aspirations in Settings
  → "Save Aspirations" → usePlayerStore.updateAspirations() → SQLite + POST /api/profile
  → "Generate My Quests" → useQuestStore.generateFromAspirations()
      → POST /api/quests/generate
          → quest_generator.generate_quests(bio, aspirations, level)
              → LangChain: Quest Master prompt | LLM | JsonOutputParser
          → fallback: synthesize_fallback_quests() on LLM failure
      → apiQuestToDomain() → questRepo.saveQuests() → SQLite
      → [New Quests Generated.] notification
```

### AI Reward Fallback Chain

```
Quest completed
  → online + backend available  →  AI-generated item (Epic/Legendary possible)
  → online + backend fails      →  static fallback item (Common) + queue API call
  → offline                     →  static fallback item (Common) + queue API call
  → device back online          →  MutationQueue replays → AI reward delivered
```

Static fallback table lives in `src/data/services/RewardService.ts`. AI prompt schema is in `docs/AI_PROMPTS.md`.

---

## Database

SQLite tables are defined in `mobile/src/data/database/schema.ts` and opened via `mobile/src/data/database/db.ts` (singleton with WAL mode enabled):

| Table | Purpose |
|---|---|
| `players` | Stats (8 attributes), level, XP, bio, **aspirations**, model preference |
| `quests` | Title, category, difficulty (E–S rank), XP/gold rewards, completion state |
| `dynamic_items` | AI-generated items; `stat_modifiers` and `special_effect` stored as JSON strings |
| `shadow_soldiers` | Habit tracking — streak, level, XP, last check-in date |
| `mutation_queue` | Offline-queued API calls pending replay |
| `app_meta` | Key-value store for app state (e.g. `last_quest_reset_date`) |

No code generation step required — schema is plain SQL executed on first open.

**Schema migrations** are applied in `db.ts` after table creation using `ALTER TABLE … ADD COLUMN` wrapped in try/catch (SQLite has no `IF NOT EXISTS` for columns). The `aspirations TEXT DEFAULT ''` column on `players` was added this way.

---

## Key Design Conventions

- **Quest difficulty**: E (easiest) → S (hardest)
- **Item rarity**: Common → Rare → Epic → Legendary; only Epic+ items have `specialEffect`
- **Stats**: 8 attributes (`strength`, `agility`, `stamina`, `intelligence`, `perception`, `discipline`, `creativity`, `mindfulness`), all start at 10, increment on level-up
- **Level-up formula**: `experience_to_next_level *= 1.5` each level
- **JSON columns**: `stat_modifiers` and `special_effect` in SQLite are stored as `JSON.stringify` strings and parsed in repository `rowTo*` mapper functions
- **API types**: FastAPI returns snake_case; `src/data/datasources/ApiTypes.ts` defines the exact response shapes; mapper functions (`apiPlayerToDomain`, `apiQuestToDomain`, etc.) convert to camelCase domain models
- **Notifications**: All messages follow Solo Leveling system style — `[Quest Complete.]`, `[Level Increased.]`, `[Daily Quest has arrived.]`
- **Environment**: API base URL is set in `src/core/env.ts` (not `constants.ts`). Change `PHYSICAL_DEVICE_IP` when running on a real device.
- **Background task**: `TaskManager.defineTask` must run at module level before any component mounts — this is why `index.ts` imports `src/core/backgroundTasks.ts` directly.
- **Aspirations**: stored on the `Player` domain model as `aspirations: string | null`. Persisted in both SQLite (`players.aspirations`) and backend `player_state`. Sent on every `POST /api/profile` call so the Quest Master always has up-to-date context.
- **Quest generation extra fields**: `quest_type`, `aspiration_tag`, `rationale` are returned by the Quest Master in the API response for display context but are **not** stored in SQLite — the existing `quests` table schema is unchanged.
- **LangChain provider factory**: `_get_llm(model_preference)` lives exclusively in `reward_generator.py`. Import it from there — do not define a second copy in `quest_generator.py`.
