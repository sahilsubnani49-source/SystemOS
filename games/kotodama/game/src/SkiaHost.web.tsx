import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { KotodamaGameProps } from './types';

/**
 * Web: Skia runs on CanvasKit (WebAssembly), which must finish loading BEFORE any
 * module that touches Skia is evaluated. So the whole game is imported lazily,
 * behind the loader. The host serves canvaskit.wasm from its web root
 * (`npx setup-skia-web public`).
 */
export function SkiaHost(props: KotodamaGameProps) {
  return (
    <WithSkiaWeb
      opts={{ locateFile: (file: string) => `/${file}` }}
      getComponent={async () => {
        const { GameRoot } = await import('./GameRoot');
        return { default: GameRoot as React.ComponentType<KotodamaGameProps> };
      }}
      fallback={
        <View style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center' }}>
          <ActivityIndicator color="#E8B04B" />
        </View>
      }
      componentProps={props}
    />
  );
}
