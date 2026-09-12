# Domain Models

The domain layer (`mobile/src/domain/`) is pure TypeScript: no React Native, SQLite,
Axios, or Expo imports. It defines the shapes the rest of the app agrees on, plus the
repository contracts the data layer implements.

> **Stack note.** This document previously described Flutter/Drift/Dart tables. That
> stack was retired; the app is React Native + TypeScript with `expo-sqlite`. Everything
> below reflects the current code.

Three vocabularies exist and are deliberately distinct:

| Layer | Casing | Defined in |
|---|---|---|
| Domain models | `camelCase` | `mobile/src/domain/models/` |
| SQLite columns | `snake_case` | `mobile/src/data/database/schema.ts` |
| API payloads | `snake_case` | `mobile/src/data/datasources/ApiTypes.ts` (TS) · `backend/app/main.py` (Pydantic) |

Repository `rowTo*` mappers convert SQLite rows to domain models; `api*ToDomain` mappers
convert API payloads. Nothing outside the data layer should see a snake_case key.

---

## Shared constants

Source: `mobile/src/core/constants.ts`

```ts
export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'] as const;
export type Rank = (typeof RANKS)[number];

export const RARITIES = ['Common', 'Rare', 'Epic', 'Legendary'] as const;
export type Rarity = (typeof RARITIES)[number];

export const STAT_KEYS = [
  'strength', 'agility', 'stamina', 'intelligence',
  'perception', 'discipline', 'creativity', 'mindfulness',
] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const MODEL_PREFERENCE = { LOCAL: 'local', CLOUD: 'cloud' } as const;
export type ModelPreference = (typeof MODEL_PREFERENCE)[keyof typeof MODEL_PREFERENCE];
```

None of these are enforced by SQLite constraints — they are TypeScript-level guarantees
applied at the repository boundary.

---

## Player

Source: `mobile/src/domain/models/Player.ts` · Table: `players`

```ts
export type PlayerStats = Record<StatKey, number>;

export interface Player {
  id: string;
  name: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  stats: PlayerStats;
  bio: string | null;
  aspirations: string | null;
  modelPreference: ModelPreference;
  rank: string;   // Hunter Rank, e.g. "E-Rank" … "S-Rank"
  keys: number;   // dungeon keys earned (1 per 21 completed days)
}
```

Effectively a singleton — the app maintains one player row. The eight stats are stored
as eight separate INTEGER columns and assembled into `stats` by the mapper.

**Progression rules** (applied in app logic, not the database):

- On level-up: `experienceToNextLevel = floor(experienceToNextLevel × 1.5)`, and every
  stat gains +1.
- All stats start at 10.
- `rank` is derived by `RankService.computeRank()` from level, campaign completion rate,
  and dungeons cleared; each contributes 0–3 points and the sum maps E→S.
- `keys` increments once per 21 fully-completed campaign days and is spent to open a
  dungeon.

---

## Goal

Source: `mobile/src/domain/models/Goal.ts` · Table: `goals`

A goal-driven campaign: what the player wants to achieve and over how many days. The AI
plans it and lays dated quests across the timeline.

```ts
export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  title: string;
  description: string;
  context: string;        // free-form life context that shaped the plan
  durationDays: number;
  startDate: string;      // YYYY-MM-DD — day 1
  endDate: string;        // YYYY-MM-DD — day N
  plan: string;           // Stage-1 strategic plan (prose)
  schedule: string;       // Stage-2 day-by-day blueprint (prose)
  daysCompleted: number;  // fully-completed days — drives key milestones
  status: GoalStatus;
  createdAt: string;
}
```

`plan` and `schedule` are stored as prose, not structured data — they are the AI's own
reasoning, kept for display and for re-grounding later generation calls.

---

## Quest

Source: `mobile/src/domain/models/Quest.ts` · Table: `quests`

```ts
export type QuestType = 'daily' | 'dungeon';

export interface DungeonChallenge {
  title: string;
  description: string;
  instructions: string;
  successCriteria: string;
  xpReward: number;
  goldReward: number;
  lootRarity: string;
}

export interface DungeonResult {
  passed: boolean;
  score: string | null;
  reportedAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;      // usually a StatKey, not enforced
  difficulty: Rank;      // E → S
  xpReward: number;
  goldReward: number;
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;

  // Goal-timeline fields
  goalId: string | null;
  scheduledFor: string | null;   // YYYY-MM-DD — the day this quest is revealed
  questType: QuestType;
  dungeonChallenge: DungeonChallenge | null;  // only when questType === 'dungeon'
  dungeonResult: DungeonResult | null;        // set after the player self-reports
  acceptedAt: string | null;     // ISO time the player tapped Accept
}
```

`dungeonChallenge` and `dungeonResult` are persisted as JSON strings in TEXT columns and
parsed by the repository mapper.

**Lifecycle.** A quest is generated with a `scheduledFor` date and stays hidden until
that day. The player *accepts* it (`acceptedAt`), then *completes* it (`isCompleted`,
`completedAt`). A day counts toward `Goal.daysCompleted` only when every quest scheduled
for it is complete.

---

## DynamicItem

Source: `mobile/src/domain/models/DynamicItem.ts` · Table: `dynamic_items`

Rewards are **real-world indulgence coupons**, not stat gear.

```ts
export type ItemType = 'token' | 'potion' | 'weapon';

export interface DynamicItem {
  id: string;
  type: ItemType;       // token = active leisure/social, potion = rest/self-care
  name: string;
  description: string;  // the real-world indulgence + its amount/duration
  rarity: Rarity;       // scales how generous the indulgence is
}
```

`weapon` exists only to cover legacy rows written before the coupon system; nothing
generates it now.

> The `dynamic_items` table still carries `stat_modifiers`, `special_effect`, and
> `is_equipped` columns from the retired gear model. The current domain model does not
> read them. See [`REWARD_SYSTEM.md`](REWARD_SYSTEM.md).

---

## TrainingExercise

Source: `mobile/src/domain/models/TrainingExercise.ts` · Table: `training_exercises`

```ts
export interface TrainingExercise {
  id: string;
  name: string;
  muscleGroup: string;
  mode: 'reps' | 'seconds';
  baseline: number;       // where the player started
  currentTarget: number;  // today's target
  maxTarget: number;      // ceiling for the progression
  stepIndex: number;      // position in the progression ladder
  daysTrained: number;
  lastCompletedDate: string | null;
  createdAt: string;
}
```

`mode` distinguishes rep-counted exercises (push-ups) from time-held ones (plank), which
changes how targets are rendered and incremented.

---

## GymSession

Source: `mobile/src/domain/models/GymSession.ts` · Table: `gym_sessions`

```ts
export interface GymSession {
  date: string;      // YYYY-MM-DD — PRIMARY KEY, one row per day
  hours: number;
  xpAwarded: number;
  createdAt: string;
}
```

Self-reported gym hours, keyed by date so a day can be revised rather than duplicated.

---

## TimeLog

Source: `mobile/src/domain/models/TimeLog.ts` · Table: `time_logs`

One timed work session in the Army tab's focus log.

```ts
export type DescriptionSource = 'manual' | 'campaign' | 'ai';

export interface TimeLog {
  id: string;
  date: string;                        // local YYYY-MM-DD, fixed at insert
  description: string;
  descriptionSource: DescriptionSource;
  goalId: string | null;               // tagged campaign, or null
  questId: string | null;              // provenance only; nothing writes back
  startedAt: string;
  endedAt: string | null;              // null ⇒ still running
  seconds: number;                     // raw measured elapsed; 0 while running
  creditedSeconds: number;             // after session + daily clamps; XP paid on this
  xpAwarded: number;
  createdAt: string;
}
```

**Key invariant:** a row with `endedAt === null` *is* the running timer, and there is at
most one. Elapsed time is always derived from `startedAt` — never stored or ticked — so a
session survives app kill, backgrounding, and re-renders with no bookkeeping.

`seconds` and `creditedSeconds` are separate on purpose: history shows the honest
measured number, while XP is paid only on the clamped value.

`descriptionSource` has three states rather than an `isAiGenerated` boolean because the
on-device template and the Architect are genuinely different provenances, and history
badges them differently.

---

## TaskLog (Hunter Log)

Source: `mobile/src/domain/models/TaskLog.ts` · Tables: `task_categories`, `task_sessions`

Hand-entered time on the Dashboard, distinct from the measured focus timer above.

```ts
/** null = plain bucket · 'gym' = also absorbs Army-tab gym hours · 'focus' = synthetic */
export type TaskCategorySource = 'gym' | 'focus' | null;

export interface TaskCategory {
  id: string;
  name: string;      // user-named bucket: "Coding", "Gym", "Studying"
  icon: string;      // a single emoji — the app has no icon font
  sortOrder: number;
  source: TaskCategorySource;
  createdAt: string;
}

export interface TaskCategorySummary extends TaskCategory {
  totalMinutes: number;   // summed on read, including any merged source time
  sourceMinutes: number;  // the slice of the above that came from `source`
  synthetic?: boolean;    // no task_categories row behind it — read-only
}

export interface TaskSession {
  id: string;
  categoryId: string;
  date: string;      // local YYYY-MM-DD
  minutes: number;
  note: string;
  xpAwarded: number;
  createdAt: string;
}
```

Three default categories are seeded on first launch. Because sessions are self-reported
rather than clocked, they are defended by a per-session ceiling and a daily cap instead
of by a timer.

Totals are never denormalized onto the category row — `TaskCategorySummary` is computed
on read, and that computation also folds in time from the other two subsystems
(`gym_sessions` for a `'gym'` category, `time_logs` for the synthetic Focus row). Those
rows are never copied into `task_sessions`: they already awarded XP where they were
recorded, so a write-through would pay for the same time twice. See
[`DATABASE_ARCHITECTURE.md`](DATABASE_ARCHITECTURE.md) § `task_categories`.

---

## Repository contracts

Source: `mobile/src/domain/repositories/`

Each interface is implemented in `mobile/src/data/repositories/` against SQLite:

| Interface | Implementation | Owns |
|---|---|---|
| `IPlayerRepository` | `PlayerRepository` | `players` |
| `IGoalRepository` | `GoalRepository` | `goals` |
| `IQuestRepository` | `QuestRepository` | `quests` |
| `IInventoryRepository` | `InventoryRepository` | `dynamic_items` |
| `ITrainingRepository` | `TrainingRepository` | `training_exercises`, `gym_sessions` |
| `ITimeLogRepository` | `TimeLogRepository` | `time_logs` |
| `ITaskLogRepository` | `TaskLogRepository` | `task_categories`, `task_sessions` |

Screens never call these directly — Zustand stores in `src/presentation/stores/` sit in
between and expose presentation-friendly actions.

---

## Backend API schemas

Source: `backend/app/main.py`

The backend validates requests with Pydantic. These are wire formats, not domain models —
the backend holds no gameplay logic beyond reward XP on the legacy path.

```python
class GoalStrategyRequest(BaseModel):
    goal: str = Field(min_length=1)
    context: Optional[str] = ""
    duration_days: int = Field(default=30, ge=1, le=120)
    level: int = Field(default=1, ge=1)
    model_preference: Optional[str] = "cloud"
    quests_per_day: int = Field(default=2, ge=1, le=5)
    previous_plan: Optional[str] = None   # present → revision mode
    feedback: Optional[str] = None


class GoalPlanRequest(BaseModel):
    goal: str = Field(min_length=1)
    context: Optional[str] = ""
    duration_days: int = Field(default=30, ge=1, le=120)
    level: int = Field(default=1, ge=1)
    model_preference: Optional[str] = "cloud"
    quests_per_day: int = Field(default=2, ge=1, le=5)
    approved_plan: Optional[str] = None


class NutritionRequest(BaseModel):
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=25, le=300)
    exercises: List[NutritionExercise] = []
    model_preference: Optional[str] = "cloud"


class CompleteQuestRequest(BaseModel):
    category: Optional[str] = None
    bio: Optional[str] = None
    model_preference: Optional[str] = None
    rarity: Optional[str] = None   # device rolls rarity; server rolls if absent
```

The reward generator's output schema is:

```python
class RewardOutput(BaseModel):
    type: str          # "token" | "potion"
    name: str
    description: str   # names the indulgence AND its amount/duration
    rarity: str        # Common | Rare | Epic | Legendary
```

### Backend persistence models

Source: `backend/app/db.py` — raw stdlib `sqlite3`, no ORM.

| Table | Columns |
|---|---|
| `users` | `id` (PK), `email` (UNIQUE COLLATE NOCASE), `password_hash`, `name`, `created_at` |
| `user_state` | `user_id` (PK → users.id), `player_json`, `quests_json`, `inventory_json`, `updated_at` |

Per-user state is stored as JSON TEXT blobs, seeded at signup from the `DEFAULT_*_STATE`
templates in `main.py`. This is a profile/seed store — the device remains the gameplay
source of truth.
