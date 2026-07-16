import axios from 'axios';
import { ENV } from '../../core/env';
import {
  ApiPlayer,
  ApiQuest,
  ApiDynamicItem,
  ApiQuestCompleteResponse,
  ApiGoalStrategyRequest,
  ApiGoalStrategyResponse,
  ApiGoalPlanRequest,
  ApiGoalPlanResponse,
  ApiDungeonGenerateResponse,
  ApiNutritionRequest,
  ApiNutritionResponse,
} from './ApiTypes';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
});

// AI generation is far slower than normal CRUD calls — these override the 10s default.
const GENERATION_TIMEOUT_MS = 240_000; // up to 4 min for a full multi-day campaign
const STRATEGY_TIMEOUT_MS = 90_000; // a single LLM call to draft the campaign strategy
const DUNGEON_TIMEOUT_MS = 60_000; // a single mock-exam generation call
const NUTRITION_TIMEOUT_MS = 30_000; // a single protein-directive generation call

// --- Interceptors ---

api.interceptors.request.use((config) => {
  if (ENV.IS_DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (ENV.IS_DEV) {
      console.log(`[API] ✓ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const message =
      error.code === 'ECONNABORTED'
        ? `Request timed out (${ENV.REQUEST_TIMEOUT_MS}ms): ${url}`
        : status
          ? `API error ${status}: ${url}`
          : `Network error: ${url}`;

    if (ENV.IS_DEV) {
      console.warn(`[API] ✗ ${message}`);
    }

    return Promise.reject(new Error(message));
  },
);

export const ApiDataSource = {
  async getProfile(): Promise<ApiPlayer> {
    const { data } = await api.get<ApiPlayer>('/api/profile');
    return data;
  },

  async updateProfile(bio: string, modelPreference: string, aspirations?: string): Promise<void> {
    await api.post('/api/profile', {
      bio,
      model_preference: modelPreference,
      aspirations: aspirations ?? '',
    });
  },

  async getQuests(): Promise<ApiQuest[]> {
    const { data } = await api.get<ApiQuest[]>('/api/quests');
    return data;
  },

  async completeQuest(
    questId: string,
    opts?: { category?: string; bio?: string; modelPreference?: string; rarity?: string },
  ): Promise<ApiQuestCompleteResponse> {
    // The goal flow is stateless — the server no longer holds the quest, so we pass
    // the category/bio it needs, plus the device-rolled drop rarity.
    const { data } = await api.post<ApiQuestCompleteResponse>(
      `/api/quests/${questId}/complete`,
      opts
        ? {
            category: opts.category,
            bio: opts.bio,
            model_preference: opts.modelPreference,
            rarity: opts.rarity,
          }
        : undefined,
    );
    return data;
  },

  async getInventory(): Promise<ApiDynamicItem[]> {
    const { data } = await api.get<ApiDynamicItem[]>('/api/inventory');
    return data;
  },

  async resetQuests(): Promise<void> {
    await api.post('/api/quests/reset');
  },

  async generateGoalStrategy(req: ApiGoalStrategyRequest): Promise<ApiGoalStrategyResponse> {
    // The strategy step is a single LLM call that drafts the day-by-day blueprint
    // for the Hunter to review. It is far quicker than the full forge, so it uses
    // its own shorter timeout rather than the multi-minute generation ceiling.
    const { data } = await api.post<ApiGoalStrategyResponse>('/api/goals/strategy', req, {
      timeout: STRATEGY_TIMEOUT_MS,
    });
    return data;
  },

  async generateGoalPlan(req: ApiGoalPlanRequest): Promise<ApiGoalPlanResponse> {
    // Campaign generation runs a multi-stage LLM pipeline (plan → schedule →
    // weekly-batched quests) = many sequential model calls. It can take minutes,
    // so it overrides the default 10s client timeout.
    const { data } = await api.post<ApiGoalPlanResponse>('/api/goals/plan', req, {
      timeout: GENERATION_TIMEOUT_MS,
    });
    return data;
  },

  async generateDungeon(req: {
    goal: string;
    context?: string;
    level: number;
    model_preference?: string;
  }): Promise<ApiDungeonGenerateResponse> {
    const { data } = await api.post<ApiDungeonGenerateResponse>('/api/dungeons/generate', req, {
      timeout: DUNGEON_TIMEOUT_MS,
    });
    return data;
  },

  async getProteinAdvice(req: ApiNutritionRequest): Promise<ApiNutritionResponse> {
    const { data } = await api.post<ApiNutritionResponse>('/api/nutrition/protein', req, {
      timeout: NUTRITION_TIMEOUT_MS,
    });
    return data;
  },
};
