# Project Structure

This document details the layout and organizational patterns used throughout the SystemOS repository.

---

## High-Level Repository Layout

```text
SystemOS/
├── assets/                  # Shared asset files (Rive/Lottie animations, fonts, logos)
├── docs/                    # Architecture blueprints and system specifications
│   └── ADR/                 # Architectural Decision Records
├── backend/                 # FastAPI backend system
│   ├── app/                 # FastAPI application source code
│   └── requirements.txt     # Python dependencies
├── src/                     # Flutter mobile application
│   ├── lib/                 # Dart source files (divided by Layered Architecture)
│   └── pubspec.yaml         # Flutter configuration and dependencies
├── scripts/                 # Maintenance, migration, and seeding scripts
└── tests/                   # Test suites (unit and integration tests)
```

---

## Detailed Component Structures

### 1. Backend (`backend/`)
The backend is structured to separate core application logic from routing operations.

```text
backend/
├── app/
│   ├── api/                 # Endpoint routers (v1, authentication, webhooks)
│   │   ├── endpoints/       # API endpoints (quests.py, player.py, rewards.py)
│   │   └── router.py        # Central API router assembly
│   ├── core/                # Configuration, logging, and security setups
│   │   ├── config.py        # Environment variable parsing (Pydantic Settings)
│   │   └── security.py      # Encryption and token validation utilities
│   ├── models/              # Pydantic schemas representing exchange formats
│   ├── services/            # Business engine (AI orchestration, experience math)
│   │   ├── ai_service.py    # LLM connector (Gemini / local Ollama)
│   │   └── game_engine.py   # Experience points and leveling calculations
│   └── main.py              # Application initialization and ASGI runner
└── requirements.txt         # Package dependencies
```

### 2. Frontend Client (`src/`)
The Flutter project is organized according to clean, layered architecture: **Presentation**, **Domain**, and **Data** layers.

```text
src/
├── lib/
│   ├── core/                # System config, routing (go_router), global constants
│   ├── data/                # Data sources, SQLite integration, API client
│   │   ├── database/        # Drift ORM definition, connections, and tables
│   │   ├── datasource/      # Local / Remote api data sources
│   │   └── repositories/    # Implementation of domain repository patterns
│   ├── domain/              # Business structures and abstract definitions
│   │   ├── models/          # Pure entities / domain models
│   │   └── repositories/    # Abstract interface contracts
│   └── presentation/        # UI widgets and state management (Riverpod)
│       ├── providers/       # State controllers and hooks
│       ├── screens/         # App screens (QuestDashboard, InventoryPage, Stats)
│       └── widgets/         # Shared component library (buttons, card containers)
└── pubspec.yaml             # Dart packages and assets registry
```

---

## Architectural Rules

1. **Unidirectional Dependency**:
   - The Presentation layer depends on Domain/Data repositories.
   - The Data layer depends on Domain contracts.
   - Domain is completely clean and independent.
2. **Offline Resilience**:
   - The frontend must check for connectivity. If offline, the client queries Drift SQLite directly.
   - When online, the client pushes cached local updates to the FastAPI backend to synchronize the profile state.
