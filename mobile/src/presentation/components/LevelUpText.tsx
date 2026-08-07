import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, useAnimatedValue } from 'react-native';
import { Colors, Fonts } from '../../core/theme';

interface Props {
  /** Increment this to (re)trigger the animation. 0 = idle. */
  token: number;
  label: string;
}

// Retro-arcade motion: instead of gliding, the text jumps upward in discrete
// notches (like an 8-bit score popup). Equal consecutive inputRange values
// create the hard steps.
const STEP_COUNT = 6;
const STEP_PX = 28;

const stepInput: number[] = [0];
const stepOutput: number[] = [0];
for (let i = 1; i <= STEP_COUNT; i++) {
  const t = (i / (STEP_COUNT + 1)) * 0.9; // jumps finish before the end flicker
  stepInput.push(t, t);
  stepOutput.push(-(i - 1) * STEP_PX, -i * STEP_PX);
}
stepInput.push(1);
stepOutput.push(-STEP_COUNT * STEP_PX);

/**
 * Pixel-style score popup shown on quest completion. Driven by `token`:
 * bump it on each completion to replay the animation. Renders nothing when idle.
 */
export function LevelUpText({ token, label }: Props) {
  const anim = useAnimatedValue(0);

  useEffect(() => {
    if (token <= 0) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 1600,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [token, anim]);

  // The opacity curve ends at 0, so once the run finishes the popup simply stays
  // mounted invisibly (pointerEvents="none") until the next token replays it.
  if (token <= 0) return null;

  const translateY = anim.interpolate({ inputRange: stepInput, outputRange: stepOutput });
  // Arcade death-flicker in the last stretch, then gone.
  const opacity = anim.interpolate({
    inputRange: [0, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1],
    outputRange: [1, 1, 0, 1, 0, 1, 0, 0],
  });

  const isLevelUp = label.toUpperCase().includes('LEVEL');

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={[styles.text, isLevelUp ? styles.levelUp : styles.xp]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  text: {
    fontFamily: Fonts.pixel,
    textAlign: 'center',
    // Hard offset shadow with zero blur = crisp 8-bit drop shadow.
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  levelUp: {
    fontSize: 24,
    color: Colors.warning,
  },
  xp: {
    fontSize: 18,
    color: Colors.accent,
  },
});
