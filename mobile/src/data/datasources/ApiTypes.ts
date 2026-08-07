// FastAPI returns snake_case — these types mirror the exact API response shapes

// --- Auth (JWT + multi-user) ---

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface ApiAuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: ApiUser;
}

export interface ApiRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// camelCase domain shape consumed by the presentation layer.
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export function apiUserToDomain(api: ApiUser): User {
  return {
    id: api.id,
    email: api.email,
    name: api.name,
    createdAt: api.created_at,
  };
}

export interface ApiPlayerStats {
  strength: number;
  agility: number;
  stamina: number;
  intelligence: number;
  perception: number;
  discipline: number;
  creativity: number;
  mindfulness: number;
}

export interface ApiPlayer {
  id: string;
  name: string;
  rank: string;
  level: number;
  experience: number;
  experience_to_next_level: number;
  bio: string;
  aspirations: string;
  model_preference: 'local' | 'cloud';
  stats: ApiPlayerStats;
}

export interface ApiQuest {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  xp_reward: number;
  gold_reward: number;
  is_completed: boolean;
  description?: string;
  day_index?: number;
  aspiration_tag?: string;
  rationale?: string;
}

export interface ApiDynamicItem {
  item_id?: string;
  id?: string;
  type: 'token' | 'potion';
  name: string;
  description: string;
  rarity: string;
}

export interface ApiQuestCompleteResponse {
  status: string;
  quest_completed: string;
  xp_gained: number;
  level_up: boolean;
  new_level: number;
  new_exp: number;
  new_exp_required: number;
  reward_item: ApiDynamicItem;
}

// --- Goal-driven campaign (replaces the old aspirations→quests flow) ---

export interface ApiGoalStrategyRequest {
  goal: string;
  context?: string;
  duration_days: number;
  level: number;
  model_preference?: 'local' | 'cloud';
  quests_per_day?: number;
  previous_plan?: string;
  feedback?: string;
}

export interface ApiGoalStrategyResponse {
  plan: string;
  ai_generated: boolean;
}

export interface ApiGoalPlanRequest {
  goal: string;
  context?: string;
  duration_days: number;
  level: number;
  model_preference?: 'local' | 'cloud';
  quests_per_day?: number;
  approved_plan?: string;
}

export interface ApiGoalPlanResponse {
  plan: string;
  schedule: string;
  quests: ApiQuest[]; // each carries day_index 1..duration_days
  goal_title: string;
  duration_days: number;
  ai_generated: boolean;
  generation_context: {
    goal_used: string;
    context_used: string;
    generated_at: string;
    model_used: string;
  };
}

// --- Dungeon (mock-exam) generation ---

export interface ApiDungeon {
  dungeon_id?: string;
  title: string;
  description: string;
  instructions: string;
  success_criteria: string;
  xp_reward: number;
  gold_reward: number;
  loot_rarity: string;
}

export interface ApiDungeonGenerateResponse {
  dungeon: ApiDungeon;
}

// --- Nutrition (protein directive) ---

export interface ApiNutritionExercise {
  name: string;
  mode: string;
  current_target: number;
  days_trained: number;
  completed_today: boolean;
}

export interface ApiNutritionRequest {
  height_cm: number;
  weight_kg: number;
  exercises: ApiNutritionExercise[];
  model_preference?: 'local' | 'cloud';
}

export interface ApiNutritionResponse {
  daily_protein_g: number;
  range_min_g: number;
  range_max_g: number;
  bmi: number;
  bmi_category: string;
  rationale: string;
  tip: string;
  ai_generated: boolean;
}

// --- Task description (focus-timer narration) ---

export interface ApiTaskQuest {
  title: string;
  description?: string;
  difficulty?: string;
  is_completed?: boolean;
  is_accepted?: boolean;
}

export interface ApiTaskDescribeRequest {
  goal_title: string;
  context?: string;
  plan_excerpt?: string;
  quests: ApiTaskQuest[];
  model_preference?: 'local' | 'cloud';
}

export interface ApiTaskDescribeResponse {
  description: string;
  focus: string;
  rationale: string;
  ai_generated: boolean;
}
