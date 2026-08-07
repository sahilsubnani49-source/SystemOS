// Campaign-derived task descriptions for the focus timer.
//
// When a Hunter tags a campaign, the System supplies the task line instead of making
// them type one. The rule below is the canonical, on-device version — the Architect's
// task-describer prompt mirrors it, and this is the offline fallback whenever the
// backend is unreachable (same relationship NutritionService has to nutrition_advisor).

import { GoalRepository } from '../repositories/GoalRepository';
import { QuestRepository } from '../repositories/QuestRepository';
import { DescriptionSource } from '../../domain/models/TimeLog';

const goalRepo = new GoalRepository();
const questRepo = new QuestRepository();

/** Hard ceiling on a stored description — PressStart2P is wide, and history truncates. */
export const MAX_DESCRIPTION_CHARS = 80;

export interface DerivedTask {
  description: string;
  questId: string | null;
  source: DescriptionSource;
}

/** Separator between the campaign and the work. ASCII on purpose — PressStart2P is a
 *  pixel face with a narrow glyph set, and an em-dash risks rendering as tofu. */
const SEPARATOR = ' - ';

/** Truncate on a word boundary, falling back to a hard cut when the last space is
 *  so early that honouring it would throw away most of the budget. */
function truncateWords(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, Math.max(0, max - 3));
  const lastSpace = cut.lastIndexOf(' ');
  const body = lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}...`;
}

/** First clause of the free-form campaign context, or null when there's nothing usable.
 *  `goals.context` defaults to '' and can be a full paragraph, so we take only up to
 *  the first sentence/clause break. */
function contextClause(context: string): string | null {
  const trimmed = context.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^[^.!?,;\n]+/);
  const clause = (match ? match[0] : trimmed).trim();
  return clause.length >= 3 ? clause : null;
}

/**
 * Compose a task line (at most MAX_DESCRIPTION_CHARS) from a campaign and, when the
 * Hunter has work scheduled, the specific quest they are grinding:
 *
 *   with a quest    →  "<goal title> - <quest title>"
 *   without a quest →  "<goal title> - <first clause of context, or 'campaign work'>"
 *
 * The goal title is what makes an entry recognisable in a list, so it keeps its full
 * length and the tail absorbs the truncation. Only when the goal alone overflows does
 * it get cut.
 */
export function composeTaskDescription(
  goalTitle: string,
  questTitle: string | null,
  context: string,
): string {
  const goal = goalTitle.trim() || 'Campaign';
  if (goal.length >= MAX_DESCRIPTION_CHARS) return truncateWords(goal, MAX_DESCRIPTION_CHARS);

  const budget = MAX_DESCRIPTION_CHARS - goal.length - SEPARATOR.length;
  // Too little room left for the tail to say anything — the goal alone is the line.
  if (budget < 8) return goal;

  const tail = questTitle?.trim() || contextClause(context) || 'campaign work';
  return `${goal}${SEPARATOR}${truncateWords(tail, budget)}`;
}

/**
 * Derive today's task for a tagged campaign.
 *
 * Quest selection order — this is the wiring to the Hunter's own quest response:
 *   1. the quest they ACCEPTED today and haven't finished (what they're actually on)
 *   2. else the lowest-difficulty incomplete quest (getDailyQuestsForGoal is already
 *      ordered by difficulty ASC, so that's just the first pending one)
 *   3. else none — fall back to campaign context alone
 *
 * Returns null when the goal is gone or no longer active; the caller then requires a
 * manual description rather than inventing one.
 */
export async function deriveCampaignTask(
  goalId: string,
  dateStr: string,
): Promise<DerivedTask | null> {
  const goal = await goalRepo.getGoal(goalId);
  if (!goal || goal.status !== 'active') return null;

  const quests = await questRepo.getDailyQuestsForGoal(goalId, dateStr);
  const accepted = quests.find((q) => q.acceptedAt !== null && !q.isCompleted);
  const pending = quests.find((q) => !q.isCompleted);
  const quest = accepted ?? pending ?? null;

  return {
    description: composeTaskDescription(goal.title, quest?.title ?? null, goal.context),
    questId: quest?.id ?? null,
    source: 'campaign',
  };
}
