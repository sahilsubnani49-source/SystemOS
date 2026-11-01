import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { BlurMask, Canvas, Circle, Group, LinearGradient, Path, Rect, Skia, useClock, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { characterImage, horseImage } from '../art/atlas';
import { SpriteImage } from '../ui/Sprite';
import { Weather } from '../fx/Weather';
import { PButton } from '../ui/Pixel';
import { useGame, useGameApi } from '../state/context';
import { C, F } from '../theme';

function mountains(w: number, h: number) {
  const b = Skia.PathBuilder.Make().moveTo(0, h * 0.62);
  const peaks = [[0.12, 0.44], [0.26, 0.56], [0.42, 0.36], [0.58, 0.52], [0.74, 0.4], [0.9, 0.54], [1, 0.48]];
  for (const [x, y] of peaks) b.lineTo(w * (x as number), h * (y as number));
  return b.lineTo(w, h).lineTo(0, h).close().build();
}

function hill(w: number, h: number) {
  return Skia.PathBuilder.Make()
    .moveTo(0, h * 0.74)
    .quadTo(w * 0.5, h * 0.62, w, h * 0.72)
    .lineTo(w, h)
    .lineTo(0, h)
    .close()
    .build();
}

export function TitleScreen({ onExit }: { onExit?: () => void }) {
  const { width: w, height: h } = useWindowDimensions();
  const hasSave = useGame((s) => s.hasSave);
  const save = useGame((s) => s.save);
  const api = useGameApi();
  const clock = useClock();
  const glow = useDerivedValue(() => 26 + Math.sin(clock.value / 700) * 6);
  const bob = useDerivedValue(() => (Math.floor(clock.value / 500) % 2) * 2);
  const heroY = useDerivedValue(() => h * 0.655 - 64 + bob.value);
  const size = 64;
  const toriiX = w * 0.68;
  const toriiY = h * 0.5;

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={w} height={h}>
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#07071A', '#1E1440', '#5A2450', '#C8546A']} positions={[0, 0.4, 0.68, 0.9]} />
        </Rect>
        {Array.from({ length: 40 }, (_, i) => (
          <Circle key={i} cx={(Math.sin(i * 91.7) * 0.5 + 0.5) * w} cy={(Math.cos(i * 37.3) * 0.5 + 0.5) * h * 0.45} r={i % 5 === 0 ? 1.4 : 0.8} color="#FFFFFF" opacity={0.7} />
        ))}
        <Circle cx={w * 0.84} cy={h * 0.075} r={glow} color="#FFE6B0" opacity={0.35}>
          <BlurMask blur={18} style="normal" />
        </Circle>
        <Circle cx={w * 0.84} cy={h * 0.075} r={22} color="#FFF4D8" />
        <Path path={mountains(w, h)} color="#2A1A3A" />
        {/* torii gate silhouette */}
        <Group color="#7A1E2E">
          <Rect x={toriiX - 46} y={toriiY} width={92} height={7} />
          <Rect x={toriiX - 38} y={toriiY + 14} width={76} height={5} />
          <Rect x={toriiX - 30} y={toriiY + 5} width={7} height={70} />
          <Rect x={toriiX + 23} y={toriiY + 5} width={7} height={70} />
        </Group>
        <Path path={hill(w, h)} color="#140E22" />
        <SpriteImage image={horseImage('right', 0)} x={w * 0.5 - size * 1.6} y={heroY} size={size} />
        <SpriteImage image={characterImage('samurai', 'down', 0)} x={w * 0.5 - size * 0.5} y={heroY} size={size} />
        <SpriteImage image={characterImage('ninja', 'down', 0)} x={w * 0.5 + size * 0.4} y={heroY} size={size} />
        <Weather kind="sakura" w={w} h={h} count={34} />
      </Canvas>

      <View style={styles.titleBlock}>
        <Text style={styles.kanji}>言霊</Text>
        <Text style={styles.title}>KOTODAMA</Text>
        <Text style={styles.tag}>Words have spirits. Learn to read them.</Text>
      </View>

      <View style={styles.menu}>
        {hasSave && save ? (
          <PButton
            testID="continue"
            label="CONTINUE"
            sub={`${save.playerName} · Lv ${save.heroLevel} · ${save.dex.caught.length} spirit${save.dex.caught.length === 1 ? "" : "s"}`}
            onPress={() => api.getState().continueGame()}
          />
        ) : null}
        <PButton testID="new-game" label="NEW GAME" tone={hasSave ? 'dim' : 'gold'} onPress={() => api.getState().openHeroSelect()} />
        {onExit ? <PButton label="LEAVE THE GATE" tone="dim" onPress={onExit} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  titleBlock: { position: 'absolute', top: '9%', left: 0, right: 0, alignItems: 'center' },
  kanji: {
    fontFamily: F.ja,
    fontSize: 84,
    lineHeight: 100,
    color: C.gold,
    textShadowColor: '#5A1E2E',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  title: { fontFamily: F.pixel, fontSize: 22, color: C.paper, letterSpacing: 4, marginTop: 4 },
  tag: { fontFamily: F.pixel, fontSize: 8, color: C.sakura, marginTop: 12 },
  menu: { position: 'absolute', left: 32, right: 32, bottom: '7%', gap: 12 },
});
