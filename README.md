# SystemOS

> A local-first personal growth app that turns real-world goals into RPG campaigns.
> Inspired by Solo Leveling.

<img width="736" height="414" alt="image" src="https://github.com/user-attachments/assets/20b4e8ba-51eb-4639-9b10-9207f32086b7" />

---

## Status

**Single-user development build.** SystemOS runs end-to-end on a simulator, emulator, or
your own device, but it is not deployed and not hardened for public multi-user use.
Known gaps and deploy blockers are tracked in [`issue.md`](issue.md).

This README describes **what exists in the code today**. Ideas that are planned but not
built are listed under [Not yet implemented](#not-yet-implemented) rather than mixed in
with shipped features.

---

## Overview

You tell SystemOS a goal ("get to 100 push-ups", "ship my side project") and how many
days you want. An AI Architect drafts a strategy, you approve or revise it, and a Quest
Master lays the goal out as dated daily quests across the timeline. Completing quests
earns XP, levels, Hunter Rank, and real-world reward coupons — permission to enjoy
something you'd otherwise feel guilty about.

Progress lives in SQLite on your device. The backend generates AI content and holds
your account; it is not required for day-to-day use.

---

## Features

### Goal campaigns
Enter a goal, free-form context, a duration (1–120 days), and quests per day. A two-step
flow drafts a strategy you can revise before committing, then generates dated quests for
the whole timeline. Quests only appear on the day they're scheduled for.

### Quests, XP, and Hunter Rank
Quests carry an E→S difficulty rank and XP/gold rewards. XP drives levels
(`experienceToNextLevel × 1.5` per level, +1 to every stat on level-up) across eight
attributes: strength, agility, stamina, intelligence, perception, discipline, creativity,
mindfulness. Hunter Rank (E→S) is computed from level, campaign completion rate, and
dungeons cleared.

### Reward coupons
Completing a quest rolls for a reward against per-rank drop odds. A drop is a
**real-world indulgence**, not stat gear — a `token` (active leisure: gaming, a friend,
a snack) or a `potion` (rest: a nap, an unplug). Rarity scales how generous it is.
The AI personalizes it to your bio; a static table covers the offline case.

### Dungeons
Every 21 fully-completed campaign days awards a **key**, which schedules an AI-generated
mock-exam dungeon for your goal — a harder one-off challenge with its own success
criteria that you self-report against.

### Training (Army tab)
Per-exercise progression with a baseline, stepped targets, and a max. Tracks days
trained and last-completed date. Also records gym hours per day, and computes a daily
protein target from your height, weight, and current training load.

### Focus timer and Hunter Log
The focus timer records one measured session per row; elapsed time is always derived
from the start timestamp, so a session survives app kill and backgrounding. Sessions can
be tagged to a campaign, and the Architect can narrate what you're working on. Separately,
the Hunter Log on the Dashboard holds user-named buckets ("Coding", "Gym") for
hand-entered time, defended by per-session and daily caps.

### Local-first behavior
SQLite on the device is the source of truth for all gameplay state. The app reads local
data first and works without the backend using rule-based fallbacks. The backend is only
needed for AI generation and account sign-in.

### System notifications
Daily reminders and in-app system dialogs in Solo Leveling style — `[Daily Quest has
arrived.]`, `[Level Increased.]` — via `expo-notifications`, with an
`expo-background-fetch` task for day transitions.

---

## Architecture

```text
┌─────────────────────────────────────────────┐
│  Mobile (Expo / React Native, TypeScript)   │
│                                             │
│  Presentation   screens · components · Zustand stores
│        ↓                                    │
│  Domain         models · repository interfaces (no deps)
│        ↓                                    │
│  Data           repositories · services · API datasource
│        ↓                                    │
│  expo-sqlite    systemos.db  ← source of truth
└──────────────────┬──────────────────────────┘
                   │ HTTPS + JWT (AI generation only)
                   ↓
┌─────────────────────────────────────────────┐
│  Backend (FastAPI, Python)                  │
│  auth.py · db.py · services/ (LangChain)    │
│  SQLite: users + per-user state             │
└──────────────────┬──────────────────────────┘
                   ↓
     Groq · xAI · Gemini · Anthropic · OpenAI · Ollama
```

### Principles

**Local-first.** The device database is the source of truth for gameplay state. The app
functions offline; AI generation degrades to deterministic fallbacks rather than failing.

**Engine-centric.** Game logic lives in `src/data/services/` and the repositories, not in
screens. The UI reads Zustand stores and never touches repositories directly.

**Strict layering.** `domain/` has zero external dependencies — no React Native, SQLite,
Axios, or Expo imports. Dependencies point one direction: presentation → domain → data.

> **Note on the backend.** Earlier documentation described the backend as stateless with
> no user accounts. That is no longer accurate: it now has JWT authentication and
> persists per-user state in its own SQLite database. Gameplay state still lives on the
> device — the backend copy is a seed/profile store, not the gameplay record.

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | Expo SDK 56, React Native 0.85, React 19.2, TypeScript 6 |
| Navigation | React Navigation 7 (native stack + bottom tabs) |
| State | Zustand 5 |
| Local DB | expo-sqlite (WAL mode) |
| HTTP | axios |
| Backend | FastAPI, Pydantic 2, Uvicorn |
| AI orchestration | LangChain Core, LangGraph |
| Auth | PyJWT (HS256), bcrypt |
| Backend DB | sqlite3 (stdlib, no ORM) |
| Notifications | expo-notifications, expo-background-fetch, expo-task-manager |

**AI providers** (cloud mode, first key present wins):
Groq → xAI Grok → Gemini → Anthropic → OpenAI. Local mode uses Ollama.

---

## Getting started

Two parts: a **FastAPI backend** (`backend/`) and an **Expo app** (`mobile/`). The app
runs without the backend using rule-based fallbacks, but you need it for sign-in and
AI-generated content.

### Prerequisites

- **Python 3.12+**
- **Node.js 20+ and npm**
- **Xcode** (iOS) or **Android Studio + JDK 17** (Android)
- *(Optional)* an AI provider key, or a local **Ollama** install

### 1. Backend

```bash
# From the repo root — virtualenv lives at backend/venv
python3 -m venv backend/venv
backend/venv/bin/python -m pip install -r backend/requirements.txt

# Configure providers and the JWT secret
cp backend/.env.example backend/.env
# Edit backend/.env — set at least one provider key (or OLLAMA_BASE_URL),
# and set JWT_SECRET_KEY to any long random string.

# Start the server
cd backend && ./venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify:

```bash
curl http://localhost:8000/health
# → {"status":"healthy","system":"SystemOS Backend","version":"0.2.0"}

curl "http://localhost:8000/health/llm?model_preference=cloud"
# → {"status":"ok","provider":"ChatGroq","reply":"pong"}
```

> The backend creates `backend/systemos.db` on first start (gitignored). Without
> `JWT_SECRET_KEY` it falls back to an insecure dev default and logs a warning.

### 2. Mobile app

This app runs on **Expo SDK 56, which the public Expo Go app cannot load** — scanning the
QR code with Expo Go fails with `incompatible SDK version`. You build a **development
client** once, then reload JS over Metro exactly like Expo Go.

```bash
cd mobile
npm install
```

#### iOS Simulator

Requires Xcode with an iOS runtime installed, plus CocoaPods.

```bash
cd ios && pod install && cd ..
npx expo run:ios                          # first build takes several minutes
npx expo run:ios --device "iPhone 17 Pro" # or target a specific simulator
```

The iOS Simulator shares the host's network, so `localhost:8000` reaches your backend
with no configuration.

#### Android Emulator

One-time setup:

1. **Install JDK 17.** A newer default JDK fails with `Unsupported class file major
   version NN`. It installs alongside your existing JDK:
   ```bash
   brew install openjdk@17
   ```
2. **Android SDK + an AVD** (Android Studio → Device Manager → e.g. Pixel 8 / API 35).
   Export the SDK tools in `~/.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
   ```
3. **Build and install the dev client** (~10 min first time, then cached):
   ```bash
   export JAVA_HOME=/opt/homebrew/opt/openjdk@17
   cd mobile && npx expo run:android
   ```

#### Every run after that (~30s, no rebuild)

```bash
# Android only: boot the emulator first
emulator -avd Pixel8 -gpu swiftshader_indirect &

cd mobile
npx expo start --dev-client   # then press  i  (iOS) or  a  (Android)
```

Re-run `expo run:ios` / `expo run:android` only when native code, native dependencies,
or `app.json` change. Plain JS/TS edits just need Metro.

### 3. Connecting to the backend

`mobile/src/core/env.ts` resolves the API base URL:

| Target | Value for `PHYSICAL_DEVICE_IP` |
|---|---|
| iOS Simulator | `localhost` (default) |
| Android Emulator | `10.0.2.2` (the host-machine alias — *not* your Wi-Fi IP) |
| Physical device | your machine's LAN IP, e.g. `192.168.1.42` (same Wi-Fi) |

Release builds instead read `EXPO_PUBLIC_API_URL`, inlined at bundle time from the active
`eas.json` build profile. That variable is **not configured yet**, so a release build
currently throws at startup by design — see SYS-015 in [`issue.md`](issue.md).

### Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `incompatible SDK version` in Expo Go | Expected. Expo Go can't run SDK 56 — use the dev build. |
| `Unsupported class file major version NN` | Default JDK too new. `export JAVA_HOME=/opt/homebrew/opt/openjdk@17`. |
| Emulator crashes / `SIGABRT` / won't boot | Free disk space (keep >10 GB); boot with `-gpu swiftshader_indirect`. |
| App works but no AI content, `Network error` logs | Backend unreachable. Normal offline; check the base URL table above. |
| `LLM unavailable` from `/health/llm` | No provider key set in `backend/.env`, or Ollama isn't running. |

---

## API reference

All `/api/*` routes require a `Bearer` access token. Auth routes are public.

### Auth

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/auth/signup` | Create an account, seed per-user state, return token pair |
| `POST` | `/auth/login` | Exchange credentials for a token pair |
| `POST` | `/auth/refresh` | Exchange a refresh token for a new pair |
| `GET` | `/auth/me` | Current user |

Access tokens last 30 minutes; refresh tokens 30 days. Passwords are bcrypt-hashed and
must be 8–72 bytes.

### Diagnostics

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness |
| `GET` | `/health/llm` | Pings the configured provider with a real call |

### AI generation

| Method | Route | Agent | Purpose |
|---|---|---|---|
| `POST` | `/api/goals/strategy` | Architect | Draft/revise a campaign strategy for preview |
| `POST` | `/api/goals/plan` | Quest Master | Plan → schedule → dated quests for the timeline |
| `POST` | `/api/dungeons/generate` | Gatekeeper | One mock-exam dungeon for a goal |
| `POST` | `/api/nutrition/protein` | Nutritionist | Daily protein target from body metrics + load |
| `POST` | `/api/tasks/describe` | Architect | One-line narration for a running focus timer |
| `POST` | `/api/quests/{id}/complete` | Architect | Generate a reward coupon |

Every AI route except `/api/goals/strategy` has a deterministic fallback and returns
HTTP 200 even when the LLM fails, flagged by `ai_generated: false`.

### Profile and state

| Method | Route | Purpose |
|---|---|---|
| `GET`/`POST` | `/api/profile` | Player profile, bio, aspirations, model preference |
| `GET` | `/api/quests` | Seed quest set |
| `GET` | `/api/inventory` | Server-side inventory copy |
| `POST` | `/api/quests/reset` | Dev utility — reset the caller's state to defaults |

---

## Repository structure

```text
SystemOS/
├── mobile/                      # Expo / React Native app
│   ├── App.tsx                  # Root UI, font loading, bootstrap gate
│   ├── index.ts                 # Entry; imports background task definitions
│   ├── app.json                 # Expo native configuration
│   ├── eas.json                 # EAS build profiles
│   ├── ios/ · android/          # Generated native projects
│   └── src/
│       ├── core/                # Config, navigation, theme, notifications, bootstrap
│       ├── domain/              # Models + repository interfaces (dependency-free)
│       ├── data/                # SQLite, repositories, services, API datasource
│       └── presentation/        # Screens, components, hooks, Zustand stores
├── backend/                     # FastAPI service
│   ├── app/main.py              # App setup, request models, routes
│   ├── app/auth.py              # JWT auth + /auth router
│   ├── app/db.py                # SQLite users + per-user state
│   ├── app/services/            # LLM provider factory + generation workflows
│   └── requirements.txt
├── docs/                        # Architecture documentation
├── web/                         # Standalone static prototype (not part of the app)
├── CLAUDE.md · AGENTS.md        # Guidance for coding agents
└── issue.md                     # Active issue register
```

### App navigation

Six bottom tabs — Dashboard, Campaign, Quests, Stats, Army (training), Settings — with
Inventory and Task Detail pushed as stack screens over them. An auth gate swaps between
the Login/Signup stack and the main stack based on auth status.

---

## Documentation

| Document | Contents |
|---|---|
| [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) | Code layout, layering rules, main flows |
| [`docs/DATABASE_ARCHITECTURE.md`](docs/DATABASE_ARCHITECTURE.md) | Every SQLite table, column, and convention |
| [`docs/DOMAIN_MODELS.md`](docs/DOMAIN_MODELS.md) | TypeScript domain models and Pydantic API schemas |
| [`docs/REWARD_SYSTEM.md`](docs/REWARD_SYSTEM.md) | Coupon model, drop odds, fallback chain |
| [`docs/AI_PROMPTS.md`](docs/AI_PROMPTS.md) | System prompts and output schemas for each agent |
| [`issue.md`](issue.md) | Active issues, priorities, and deploy blockers |
| [`CLAUDE.md`](CLAUDE.md) | Conventions and commands for coding agents |

---

## Not yet implemented

Named in earlier drafts of this README but **absent from the codebase**. Listed here so
the gap is explicit rather than implied:

- **Shadow Army** — a `shadow_soldiers` table exists in the schema but has no repository,
  store, model, or UI. It is dead schema; the Army tab is the training system instead.
- **Skill trees, achievements, titles, boss raids** — no code.
- **Memory system / local vector database** — no code.
- **Analytics** — streaks, heatmaps, burnout detection: no code. The Stats screen shows
  current player stats only.
- **Voice, wearables, multiplayer** — no code.
- **Named AI companion personas** — the implemented agents are the Architect, Quest
  Master, Gatekeeper, and Nutritionist. There are no character-voiced companions.
- **Desktop and web clients** — mobile only. `web/` is an unrelated static prototype.
- **Automated tests** — there is no test suite (SYS-014).

---

## Contributing notes

- Domain code stays dependency-free; screens use Zustand stores, never repositories.
- FastAPI returns snake_case; mappers in `src/data/datasources/` convert to camelCase.
- SQLite migrations are additive `ALTER TABLE … ADD COLUMN` in `db.ts`, wrapped in
  try/catch — existing installs must never lose local progress.
- Background task definitions must be imported before React mounts (`mobile/index.ts`).
- Before changing behavior, read [`issue.md`](issue.md) for known gaps in that area.

```bash
cd mobile
npm run lint          # eslint
npm run format        # prettier
npx tsc --noEmit      # typecheck
```
