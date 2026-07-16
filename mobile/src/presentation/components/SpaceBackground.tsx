import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Colors, withAlpha } from '../../core/theme';

/**
 * Full-app ambient backdrop: a deep-space scene with a slowly falling,
 * twinkling star field, periodic shooting stars, and a black hole whose
 * accretion disk rotates around a pulsing event horizon.
 *
 * Mounted once in App.tsx behind the navigator; every screen root is
 * transparent so this shows through. All animations use the native driver,
 * and the layer is pointerEvents="none" so it never intercepts touches.
 */

const STAR_COUNT = 46;
/** One full screen-height of downward drift takes this long (ms). */
const DRIFT_DURATION = 90_000;

export interface StarConfig {
  /** Horizontal position as a fraction of screen width (0..1). */
  x: number;
  /** Vertical position as a fraction of screen height (0..1). */
  y: number;
  /** Diameter in px. */
  size: number;
  /** Peak opacity when fully twinkled-in (0..1). */
  baseOpacity: number;
  /** Half-cycle of the twinkle (fade-in time = fade-out time), ms. */
  twinkleDuration: number;
  color: string;
}

const STAR_COLORS = [Colors.textPrimary, Colors.accent, '#FFE9C4'];

function createStarField(count: number): StarConfig[] {
  const stars: StarConfig[] = [];
  for (let i = 0; i < count; i++) {
    // TODO(human): push one StarConfig per iteration to shape the sky.
  }
  return stars;
}

function TwinklingStar({
  star,
  width,
  height,
}: {
  star: StarConfig;
  width: number;
  height: number;
}) {
  const twinkle = useRef(new Animated.Value(Math.random())).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: star.twinkleDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: star.twinkleDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [twinkle, star.twinkleDuration]);

  const opacity = twinkle.interpolate({
    inputRange: [0, 1],
    outputRange: [star.baseOpacity * 0.15, star.baseOpacity],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: star.x * width,
        top: star.y * height,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: star.color,
        opacity,
      }}
    />
  );
}

/**
 * The field is rendered twice, stacked vertically, and the parent slides one
 * screen-height down in a linear loop. Because both copies are identical the
 * reset from translateY=height back to 0 is invisible — infinite falling sky
 * for the cost of a single position animation.
 */
function DriftingStarField({
  stars,
  width,
  height,
}: {
  stars: StarConfig[];
  width: number;
  height: number;
}) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: DRIFT_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [drift]);

  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, height] });

  const layer = (
    <>
      {stars.map((star, i) => (
        <TwinklingStar key={i} star={star} width={width} height={height} />
      ))}
    </>
  );

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>
      <View style={{ position: 'absolute', top: -height, width, height }}>{layer}</View>
      <View style={{ position: 'absolute', top: 0, width, height }}>{layer}</View>
    </Animated.View>
  );
}

interface Flight {
  startX: number;
  startY: number;
  distance: number;
}

/** 40° down-right trajectory; randomized start point and travel distance. */
function randomFlight(width: number, height: number): Flight {
  return {
    startX: Math.random() * width * 0.7 - width * 0.1,
    startY: Math.random() * height * 0.5,
    distance: 180 + Math.random() * 160,
  };
}

const FLIGHT_ANGLE_RAD = (40 * Math.PI) / 180;

function ShootingStar({
  width,
  height,
  initialDelay,
}: {
  width: number;
  height: number;
  initialDelay: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const [flight, setFlight] = useState(() => randomFlight(width, height));

  useEffect(() => {
    let alive = true;
    const run = (delay: number) => {
      progress.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && alive) {
          setFlight(randomFlight(width, height));
          run(4000 + Math.random() * 8000);
        }
      });
    };
    run(initialDelay);
    return () => {
      alive = false;
      progress.stopAnimation();
    };
  }, [progress, width, height, initialDelay]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [flight.startX, flight.startX + flight.distance * Math.cos(FLIGHT_ANGLE_RAD)],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [flight.startY, flight.startY + flight.distance * Math.sin(FLIGHT_ANGLE_RAD)],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.15, 0.75, 1],
    outputRange: [0, 1, 0.9, 0],
  });

  return (
    <Animated.View
      style={[
        styles.shootingStar,
        { opacity, transform: [{ translateX }, { translateY }, { rotate: '40deg' }] },
      ]}
    >
      <View style={styles.shootingStarTail} />
      <View style={styles.shootingStarHead} />
    </Animated.View>
  );
}

const HOLE_SIZE = 150;

function BlackHole() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    spinAnim.start();
    pulseAnim.start();
    return () => {
      spinAnim.stop();
      pulseAnim.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counterRotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const horizonScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <View style={styles.blackHole}>
      {/* Outer accretion disk — asymmetric border colors make the spin visible. */}
      <Animated.View style={[styles.accretionOuter, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.accretionInner, { transform: [{ rotate: counterRotate }] }]} />
      {/* Photon-ring glow, breathing with the pulse. */}
      <Animated.View style={[styles.photonRing, { opacity: glowOpacity }]} />
      {/* Event horizon: light does not escape. */}
      <Animated.View style={[styles.eventHorizon, { transform: [{ scale: horizonScale }] }]} />
    </View>
  );
}

export function SpaceBackground() {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => createStarField(STAR_COUNT), []);

  return (
    <View pointerEvents="none" style={styles.root}>
      {/* Faint nebulae for depth. */}
      <View style={[styles.nebula, styles.nebulaPurple]} />
      <View style={[styles.nebula, styles.nebulaCyan]} />
      <DriftingStarField stars={stars} width={width} height={height} />
      <BlackHole />
      <ShootingStar width={width} height={height} initialDelay={2500} />
      <ShootingStar width={width} height={height} initialDelay={9000} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  nebula: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
  },
  nebulaPurple: {
    top: -120,
    left: -140,
    backgroundColor: withAlpha(Colors.primary, 0.07),
  },
  nebulaCyan: {
    bottom: -160,
    right: -120,
    backgroundColor: withAlpha(Colors.accent, 0.05),
  },
  shootingStar: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  shootingStarTail: {
    width: 64,
    height: 2,
    borderRadius: 1,
    backgroundColor: withAlpha(Colors.textPrimary, 0.35),
  },
  shootingStarHead: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textPrimary,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
  },
  blackHole: {
    position: 'absolute',
    top: 110,
    right: -HOLE_SIZE * 0.3,
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.75,
  },
  accretionOuter: {
    position: 'absolute',
    width: HOLE_SIZE,
    height: HOLE_SIZE,
    borderRadius: HOLE_SIZE / 2,
    borderWidth: 2,
    borderTopColor: withAlpha(Colors.accent, 0.8),
    borderRightColor: withAlpha(Colors.primary, 0.5),
    borderBottomColor: 'transparent',
    borderLeftColor: withAlpha(Colors.orange, 0.4),
  },
  accretionInner: {
    position: 'absolute',
    width: HOLE_SIZE * 0.72,
    height: HOLE_SIZE * 0.72,
    borderRadius: (HOLE_SIZE * 0.72) / 2,
    borderWidth: 2,
    borderTopColor: withAlpha(Colors.orange, 0.6),
    borderRightColor: 'transparent',
    borderBottomColor: withAlpha(Colors.primary, 0.45),
    borderLeftColor: 'transparent',
  },
  photonRing: {
    position: 'absolute',
    width: HOLE_SIZE * 0.5,
    height: HOLE_SIZE * 0.5,
    borderRadius: (HOLE_SIZE * 0.5) / 2,
    borderWidth: 3,
    borderColor: withAlpha(Colors.accent, 0.6),
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 12,
  },
  eventHorizon: {
    position: 'absolute',
    width: HOLE_SIZE * 0.42,
    height: HOLE_SIZE * 0.42,
    borderRadius: (HOLE_SIZE * 0.42) / 2,
    backgroundColor: '#000000',
  },
});
