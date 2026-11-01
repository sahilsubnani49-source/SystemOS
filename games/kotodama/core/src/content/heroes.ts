import type { Element } from './elements';
import type { BaseStats } from './spirits';
import type { MoveId } from './moves';

export type HeroClass = 'samurai' | 'ninja';

export interface HeroDef {
  id: HeroClass;
  title: string;
  titleJa: string;
  element: Element;
  base: BaseStats;
  moves: MoveId[];
  /** Mirror move learned from Runa in Frost Harbor (flag `learned_mirror`). */
  mirrorMove: MoveId;
  /** Extra damage per consecutive correct answer. Ninja chains harder. */
  comboStep: number;
  sprite: string;
  pitch: string;
}

export const HEROES: Record<HeroClass, HeroDef> = {
  samurai: {
    id: 'samurai', title: 'Samurai', titleJa: '侍', element: 'steel',
    base: { hp: 60, atk: 14, def: 13, spd: 8 }, moves: ['iai', 'kesa', 'stance'], mirrorMove: 'twinDraw',
    comboStep: 0.1, sprite: 'samurai',
    pitch: 'Heavy blade, iron guard. Recall each kana from its sound to land crushing draws.',
  },
  ninja: {
    id: 'ninja', title: 'Ninja', titleJa: '忍', element: 'shadow',
    base: { hp: 48, atk: 12, def: 9, spd: 15 }, moves: ['shuriken', 'kunai', 'smoke'], mirrorMove: 'mirrorKunai',
    comboStep: 0.15, sprite: 'ninja',
    pitch: 'Speed and shadows. Answer fast for critical hits and chain long combos.',
  },
};
