import type { Tale, TalePage } from '../tales';
import type { Weather } from '../../world/types';

/**
 * A folk tale with a place in the world. A signpost on a story map (the host) leads
 * to a small scene built for the tale: the tale board stands by the door, the tale's
 * own people (and animals, and the odd haunted teakettle) stand inside and talk the way
 * the story says they would. Read the board to read the whole tale, in kana or kanji.
 *
 * The tales are centuries old and belong to everyone. Every retelling, line and
 * character voice here was written for this game.
 */
export type SceneKind =
  | 'house' | 'inn' | 'shrine' | 'temple' | 'shore' | 'river' | 'forest' | 'bamboo'
  | 'mountain' | 'snow' | 'palace' | 'cave' | 'field' | 'bridge' | 'street' | 'night';

/** A line someone says: optional Japanese, then the English. */
export type Say = [ja: string | undefined, text: string];

export interface TalePerson {
  name: string;
  /**
   * Sprite key: a character ('samurai', 'oni'), a spirit ('kobi1'), a look preset
   * ('folk:oldman:<unique id>'), or a story object ('prop:peach').
   */
  sprite: string;
  lines: Say[];
}

export interface TaleSite {
  tale: Tale;
  /** The story map whose signpost leads here. */
  host: string;
  scene: SceneKind;
  place: string;
  placeJa: string;
  /** Stands in the middle of the scene: the story's object or its central figure. */
  heart: TalePerson;
  /** Up to three more around it. */
  people: TalePerson[];
  weather?: Weather;
}

/** One page: kana with spaces between words, the same with kanji, and the English. */
export const pg = (ja: string, kanji: string, en: string): TalePage => ({ ja, kanji, en });

export function tale(id: string, title: string, titleJa: string, pages: TalePage[]): Tale {
  return { id, title, titleJa, area: 'board', pages };
}
