import { hashText } from '@yotei/core';

/** Quiet, legible palette: a planner should read like paper, not a game. */
export const C = {
  bg: '#0F1217',
  surface: '#171B22',
  surface2: '#1F2530',
  line: '#2A313D',
  text: '#E8EAED',
  dim: '#8B93A1',
  faint: '#5C6573',
  accent: '#6CC6A9',
  warn: '#F2A65A',
  danger: '#E5534B',
  now: '#7AA2F7',
} as const;

export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const MONO = 'monospace';

const PLAN_COLORS = ['#6CC6A9', '#7AA2F7', '#F2A65A', '#C792EA', '#F07178', '#FFCB6B', '#89DDFF'] as const;

/** A stable colour per plan, so items from several plans can be told apart at a glance. */
export function planColor(planId: string): string {
  return PLAN_COLORS[parseInt(hashText(planId), 16) % PLAN_COLORS.length] as string;
}
