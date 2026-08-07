import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../../core/env';
import { TokenStorage } from '../services/TokenStorage';
import { AuthService } from '../services/AuthService';
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
  ApiTaskDescribeRequest,
  ApiTaskDescribeResponse,
} from './ApiTypes';

// Marker flag on a request config so a 401-triggered retry is attempted at most
// once — prevents an infinite refresh→retry→401 loop.
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// eslint-disable-next-line import/no-named-as-default-member -- axios.create on the default export is the canonical axios API
const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
});

// AI generation is far slower than normal CRUD calls — these override the 10s default.
const GENERATION_TIMEOUT_MS = 240_000; // up to 4 min for a full multi-day campaign
const STRATEGY_TIMEOUT_MS = 90_000; // a single LLM call to draft the campaign strategy
const DUNGEON_TIMEOUT_MS = 60_000; // a single mock-exam generation call
const NUTRITION_TIMEOUT_MS = 30_000; // a single protein-directive generation call
const TASK_DESCRIBE_TIMEOUT_MS = 30_000; // a single task-line generation call
const HEALTH_TIMEOUT_MS = 5_000; // plain reachability ping — fail fast
const LLM_HEALTH_TIMEOUT_MS = 45_000; // one-word LLM ping; local Ollama may cold-load the model

// --- Interceptors ---

api.interceptors.request.use(async (config) => {
  // Attach the current access token so every /api/* call is authenticated.
  const accessToken = await TokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
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
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalConfig = error.config as RetryableConfig | undefined;

    // 401 → the access token likely expired. Refresh once (single-flight in
    // AuthService) and replay the original request. The _retry guard ensures we
    // never loop, and a refresh failure falls through to session-expiry below.
    if (status === 401 && originalConfig && !originalConfig._retry) {
      originalConfig._retry = true;
      try {
        const newAccessToken = await AuthService.refreshTokens();
        originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalConfig);
      } catch {
        // Refresh gave up — tell the presentation layer to log the Hunter out,
        // then fall through to the existing error-mapping so the caller still
        // receives a rejected promise.
        AuthService.notifySessionExpired();
      }
    }

    const url = error.config?.url ?? '';
    // Long-running generation calls override the default timeout — report the
    // timeout that was actually in effect, not the 10s default.
    const effectiveTimeoutMs = error.config?.timeout ?? ENV.REQUEST_TIMEOUT_MS;
    const message =
      error.code === 'ECONNABORTED'
        ? `Request timed out (${effectiveTimeoutMs}ms): ${url}`
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
  async checkHealth(): Promise<void> {
    await api.get('/health', { timeout: HEALTH_TIMEOUT_MS });
  },

  async checkLlmHealth(modelPreference: string): Promise<{ provider: string }> {
    const { data } = await api.get<{ status: string; provider: string }>('/health/llm', {
      params: { model_preference: modelPreference },
      timeout: LLM_HEALTH_TIMEOUT_MS,
    });
    return { provider: data.provider };
  },

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

  async describeTask(req: ApiTaskDescribeRequest): Promise<ApiTaskDescribeResponse> {
    const { data } = await api.post<ApiTaskDescribeResponse>('/api/tasks/describe', req, {
      timeout: TASK_DESCRIBE_TIMEOUT_MS,
    });
    return data;
  },
};
