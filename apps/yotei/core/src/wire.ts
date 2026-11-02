import { UNITS, type DraftPeriod, type PlanDraft, type Rejection, type Unit } from './types';

// The backend's snake_case response for POST /api/yotei/parse, and its mapping to the
// camelCase PlanDraft. Lives in core so SystemOS and the standalone app share one
// mapping (no snake_case escapes into the UI).

export interface WirePeriod {
  unit: string;
  index?: number | null;
  weekday?: number | null;
  date?: string | null;
  end_date?: string | null;
  time_start?: string | null;
  time_end?: string | null;
}

export interface WireParseResponse {
  plan: {
    title: string;
    boundary_quote: string;
    horizon: { unit: string; length: number } | null;
    start_date: string | null;
    end_date: string | null;
  };
  items: { quote: string; period_quote: string; period: WirePeriod }[];
  rejected: Rejection[];
  unscheduled: Rejection[];
  unassigned_lines: string[];
  ai_generated?: boolean;
}

const asUnit = (u: string): Unit | null => ((UNITS as readonly string[]).includes(u) ? (u as Unit) : null);

function period(p: WirePeriod): DraftPeriod | null {
  const unit = asUnit(p.unit);
  if (!unit) return null;
  return {
    unit,
    index: p.index ?? null,
    weekday: p.weekday ?? null,
    date: p.date ?? null,
    endDate: p.end_date ?? null,
    timeStart: p.time_start ?? null,
    timeEnd: p.time_end ?? null,
  };
}

export function draftFromWire(body: WireParseResponse): PlanDraft {
  const unscheduled = [...(body.unscheduled ?? [])];
  const items: PlanDraft['items'] = [];
  for (const it of body.items ?? []) {
    const p = period(it.period);
    if (p) items.push({ quote: it.quote, periodQuote: it.period_quote, period: p });
    else unscheduled.push({ quote: it.quote, reason: 'Unreadable timing' });
  }
  const hUnit = body.plan.horizon ? asUnit(body.plan.horizon.unit) : null;
  return {
    title: body.plan.title,
    boundaryQuote: body.plan.boundary_quote,
    horizon: hUnit && body.plan.horizon ? { unit: hUnit, length: body.plan.horizon.length } : null,
    startDate: body.plan.start_date,
    endDate: body.plan.end_date,
    items,
    rejected: body.rejected ?? [],
    unscheduled,
    unassignedLines: body.unassigned_lines ?? [],
  };
}
