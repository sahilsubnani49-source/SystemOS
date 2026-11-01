import React from 'react';
import { Canvas, FilterMode, Image, MipmapMode, type SkImage } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

/** Crisp pixel scaling: never blur pixel art. */
export const PIXEL_SAMPLING = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const;

type Num = number | SharedValue<number>;

/** A pixel sprite inside an existing Skia <Canvas>. */
export function SpriteImage({ image, x, y, size, opacity }: { image: SkImage; x: Num; y: Num; size: number; opacity?: Num }) {
  return <Image image={image} x={x} y={y} width={size} height={size} sampling={PIXEL_SAMPLING} opacity={opacity} />;
}

/** A pixel sprite as a standalone RN view (menus, cards). */
export function SpriteView({ image, size, style }: { image: SkImage; size: number; style?: StyleProp<ViewStyle> }) {
  return (
    // Canvas on web can't take a style ARRAY (it assigns indices onto a DOM style).
    <Canvas style={StyleSheet.flatten([{ width: size, height: size }, style])}>
      <Image image={image} x={0} y={0} width={size} height={size} sampling={PIXEL_SAMPLING} />
    </Canvas>
  );
}
