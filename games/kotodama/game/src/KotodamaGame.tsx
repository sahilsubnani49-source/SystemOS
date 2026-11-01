import React from 'react';
import { SkiaHost } from './SkiaHost';
import type { KotodamaGameProps } from './types';

/** Public entry point. Hosts render this and nothing else from the package. */
export function KotodamaGame(props: KotodamaGameProps) {
  return <SkiaHost {...props} />;
}
