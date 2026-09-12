export const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    experience_to_next_level INTEGER NOT NULL DEFAULT 100,
    strength INTEGER NOT NULL DEFAULT 10,
    agility INTEGER NOT NULL DEFAULT 10,
    stamina INTEGER NOT NULL DEFAULT 10,
    intelligence INTEGER NOT NULL DEFAULT 10,
    perception INTEGER NOT NULL DEFAULT 10,
    discipline INTEGER NOT NULL DEFAULT 10,
    creativity INTEGER NOT NULL DEFAULT 10,
    mindfulness INTEGER NOT NULL DEFAULT 10,
    bio TEXT,
    aspirations TEXT DEFAULT '',
    model_preference TEXT NOT NULL DEFAULT 'local',
    rank TEXT NOT NULL DEFAULT 'E-Rank',
    keys INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    context TEXT NOT NULL DEFAULT '',
    duration_days INTEGER NOT NULL DEFAULT 1,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT '',
    schedule TEXT NOT NULL DEFAULT '',
    days_completed INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS quests (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'E',
    xp_reward INTEGER NOT NULL DEFAULT 0,
    gold_reward INTEGER NOT NULL DEFAULT 0,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    goal_id TEXT,
    scheduled_for TEXT,
    quest_type TEXT NOT NULL DEFAULT 'daily',
    dungeon_challenge TEXT,
    dungeon_result TEXT,
    accepted_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS dynamic_items (
    id TEXT PRIMARY KEY NOT NULL,
    type TEXT NOT NULL DEFAULT 'token',
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    rarity TEXT NOT NULL DEFAULT 'Common',
    stat_modifiers TEXT NOT NULL DEFAULT '{}',
    special_effect TEXT,
    is_equipped INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS shadow_soldiers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_check_in TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS training_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    mode TEXT NOT NULL,
    baseline INTEGER NOT NULL,
    current_target INTEGER NOT NULL,
    max_target INTEGER NOT NULL,
    step_index INTEGER NOT NULL DEFAULT 0,
    days_trained INTEGER NOT NULL DEFAULT 0,
    last_completed_date TEXT,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS gym_sessions (
    date TEXT PRIMARY KEY NOT NULL,
    hours REAL NOT NULL DEFAULT 0,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  // Focus timer sessions. Unlike gym_sessions (one self-reported row per day), this
  // is one row per measured session. A row with ended_at IS NULL *is* the running
  // timer — elapsed is always derived from started_at, never stored or ticked.
  `CREATE TABLE IF NOT EXISTS time_logs (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    description_source TEXT NOT NULL DEFAULT 'manual',
    goal_id TEXT,
    quest_id TEXT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    seconds INTEGER NOT NULL DEFAULT 0,
    credited_seconds INTEGER NOT NULL DEFAULT 0,
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_time_logs_date ON time_logs (date)`,

  // Hunter Log (Dashboard). A category is a user-named bucket ("Coding", "Gym");
  // a session is one self-reported chunk of time logged against it. Totals are
  // never stored on the category — they are summed from sessions on read.
  // `source` links a category to time recorded by another subsystem. NULL is a plain
  // hand-entry bucket; 'gym' also absorbs gym_sessions hours logged in the Army tab.
  // It is a link, not a total — the merge happens on read, so XP is never re-awarded.
  `CREATE TABLE IF NOT EXISTS task_categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '⏱️',
    sort_order INTEGER NOT NULL DEFAULT 0,
    source TEXT,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS task_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    date TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    xp_awarded INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_task_sessions_category ON task_sessions (category_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_task_sessions_date ON task_sessions (date)`,
];
