# SystemOS

> A privacy-first, offline-first personal growth operating system inspired by Solo Leveling.




<img width="736" height="414" alt="image" src="https://github.com/user-attachments/assets/20b4e8ba-51eb-4639-9b10-9207f32086b7" />


---

# Overview

SystemOS transforms real-world actions into RPG mechanics.

Users progress through life by completing quests, gaining experience, unlocking skills, earning titles, and defeating increasingly difficult challenges.

Unlike traditional productivity applications, SystemOS is designed as an engine for long-term human progression.

The system prioritizes:

* Privacy
* Local ownership of data
* Modularity
* Offline capability
* AI-assisted progression
* Gamification

SystemOS is inspired by:

* Solo Leveling
* Skyrim
* Persona
* Diablo
* Elden Ring

---

# Philosophy

SystemOS is based on four principles.

## Local First

The user's device is the source of truth.

All persistent data belongs to the user.

---

## Stateless Backend

The backend exists only to generate responses.

It does not maintain user accounts or store historical data.

---

## Engine-Centric Design

Business logic belongs inside the SystemOS Engine.

The UI only displays state.

---

## Modular Architecture

Every subsystem should be independently extensible.

New modules should be addable without modifying the core engine.

---

# High-Level Architecture

```text
User
 ↓

Presentation Layer

 ↓

Application Layer

 ↓

SystemOS Engine

 ↓

Repositories

 ↓

expo-sqlite

 ↓

SQLite Database
```

---

# Main Systems

SystemOS consists of multiple independent systems.

## Core Engine

Responsible for:

* Experience calculations
* Level progression
* Rewards
* Achievements
* Titles
* Skill trees
* Quest state transitions

---

## Quest System

Generates and manages:

* Daily quests
* Weekly quests
* Rank-up trials
* Urgent quests

---

## Player System

Represents the player's stats and progression.

Base attributes:

* Strength
* Agility
* Stamina
* Intelligence
* Perception
* Discipline
* Creativity
* Mindfulness

---

## Inventory System

Stores:

* Gold
* Consumables
* Skill scrolls
* Cosmetic items
* Titles

---

## Skill Tree System

Controls character specialization and progression.

---

## Achievement System

Tracks milestones and rewards consistency.

---

## Shadow Army System

Represents habits as evolving soldiers.

Examples:

* Running
* Reading
* Coding
* Meditation

---

## Dungeon System

Groups related quests into larger objectives.

Examples:

* Fitness Dungeon
* Coding Dungeon
* Knowledge Dungeon

---

## Boss Raid System

Provides weekly and monthly challenges.

---

## AI System

AI components include:

### Quest Master

Generates daily quests.

### Architect

Balances difficulty.

### Shadow Monarch

Creates long-term progression plans.

### Beru

Acts as a motivational companion.

### Sung Jin-Woo

Provides narrative flavor.

---

## Analytics System

Tracks:

* Streaks
* Heatmaps
* Completion rates
* Burnout patterns
* Peak productivity periods

---

## Notification System

Provides immersive system messages.

Examples:

```text
[Daily Quest has arrived.]

[Level Increased.]

[Penalty countdown initiated.]

[New title acquired.]
```

---

## Memory System

Maintains local long-term memory.

Stores:

* Goals
* Journals
* Victories
* Failures

Uses local vector databases for semantic retrieval.

---

# Supported Platforms

Primary platforms:

* Android
* iOS

Future platforms:

* Windows
* macOS
* Linux
* Web Dashboard

---

# Technology Stack

Frontend:

* React Native
* Expo
* TypeScript
* Zustand
* React Navigation
* expo-sqlite

Backend:

* FastAPI
* Pydantic
* LangChain + LangGraph

AI Providers:

* Gemini
* OpenAI
* Claude
* DeepSeek
* Ollama

Notifications & background tasks:

* expo-notifications
* expo-background-fetch

---

# Getting Started (Local Development)

This repo has two parts: a **FastAPI backend** (`backend/`) and a **React Native (Expo)
mobile app** (`mobile/`). The app is offline-first — it runs **without** the backend
(using rule-based fallbacks); the backend is only needed for AI-generated quests and
reward items.

## Prerequisites

* **Python 3.12+** (backend)
* **Node.js 18+ and npm** (mobile app)
* **Expo Go** app on your phone — only if running on a physical device
* *(Optional)* an AI provider key (Anthropic / OpenAI / Google) or a local
  **Ollama** install — only if you want AI-generated content

## 1. Backend (FastAPI)

```bash
# From the repo root
source venv/bin/activate                      # virtualenv lives at the repo root
pip install -r backend/requirements.txt

# (Optional) configure AI providers — the backend runs without this
cp backend/.env.example backend/.env
# then edit backend/.env and set at least one of
# ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_API_KEY
# (or set OLLAMA_BASE_URL for local AI)

# Start the API server
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify it's up:

```bash
curl http://localhost:8000/health
# → {"status":"healthy","system":"SystemOS Backend","version":"0.2.0"}
```

## 2. Mobile app (Expo / React Native)

```bash
cd mobile
npm install
npm start            # starts the Expo dev server
```

Then launch the app:

* Press **`i`** to open the **iOS Simulator** (macOS + Xcode), or run `npm run ios`
* Press **`a`** to open an **Android Emulator**, or run `npm run android`
* Or scan the QR code with the **Expo Go** app on a physical device

## Running on a physical device

Simulators reach the backend at `localhost`. A physical device cannot — edit
`mobile/src/core/env.ts` and set `PHYSICAL_DEVICE_IP` to your computer's local network
IP (e.g. `192.168.1.42`):

```ts
const PHYSICAL_DEVICE_IP = '192.168.1.42'; // your machine's LAN IP
```

The phone and your computer must be on the **same Wi-Fi network**.

> Find your IP — macOS: System Settings → Wi-Fi → Details · Linux: `ip addr show` ·
> Windows: `ipconfig`.

---

# Repository Structure

```text
docs/
src/
backend/
scripts/
tests/
assets/
```

Documentation is split into multiple files to improve maintainability and allow AI coding agents to understand the system more effectively.

---

# Documentation Index

## Product

* PRODUCT_VISION.md

---

## Architecture

* ARCHITECTURE.md
* TECH_STACK.md
* PROJECT_STRUCTURE.md

---

## Persistence

* DATABASE.md
* DOMAIN_MODELS.md
* EVENT_SYSTEM.md

---

## Core Systems

* GAME_ENGINE.md
* PLAYER_SYSTEM.md
* QUEST_SYSTEM.md
* SKILL_TREE_SYSTEM.md
* INVENTORY_SYSTEM.md
* TITLE_SYSTEM.md
* ACHIEVEMENT_SYSTEM.md

---

## Advanced Systems

* SHADOW_ARMY_SYSTEM.md
* DUNGEON_SYSTEM.md
* BOSS_RAID_SYSTEM.md

---

## AI

* AI_SYSTEM.md
* AI_PROMPTS.md
* MEMORY_SYSTEM.md

---

## Infrastructure

* API_SPECIFICATION.md
* SECURITY.md
* BACKUP_AND_SYNC.md

---

## Platform Systems

* NOTIFICATION_SYSTEM.md
* ANALYTICS_SYSTEM.md
* VOICE_SYSTEM.md
* WEARABLES_SYSTEM.md
* MULTIPLAYER_SYSTEM.md

---

## Planning

* ROADMAP.md

---

## Architecture Decision Records

Located under:

```text
docs/ADR/
```

These documents explain major architectural decisions and the rationale behind them.

---

# Guiding Principle

The UI is replaceable.

The backend is replaceable.

The database is replaceable.

The AI provider is replaceable.

The engine is permanent.

Every system should be designed around protecting and extending the engine.

---

# Ultimate Objective

SystemOS exists to help users become stronger in the real world through consistent action while maintaining complete ownership of their data.


