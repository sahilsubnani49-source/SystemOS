import type { Tale } from '../tales';
import type { TaleSite } from './types';
import { CLASSIC_SITES } from './classic';
import { YOKAI_SITES } from './yokai';
import { LEGEND_SITES } from './legends';

export * from './types';
export * from './reward';

/** Every folk tale with a place in the world, in the order their signposts are placed. */
export const FOLK_SITES: readonly TaleSite[] = [...CLASSIC_SITES, ...YOKAI_SITES, ...LEGEND_SITES];
export const FOLK_TALES: readonly Tale[] = FOLK_SITES.map((s) => s.tale);
