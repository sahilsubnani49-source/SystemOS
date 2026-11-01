import React from 'react';
import { GameRoot } from './GameRoot';
import type { KotodamaGameProps } from './types';

/** Native: Skia is linked into the binary, so render the game directly. */
export function SkiaHost(props: KotodamaGameProps) {
  return <GameRoot {...props} />;
}
