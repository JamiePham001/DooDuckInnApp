import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useSchemeName } from '@/hooks/use-theme';

// Must match the expo-splash-screen plugin's backgroundColor (and its `dark` variant) in
// app.json. The native splash deliberately has NO image — it is a bare colour field that
// this overlay continues seamlessly, which is why the duck can animate in over it without
// a visible handoff.
const SPLASH_BACKGROUND = { light: '#1877F2', dark: '#0C0D0F' } as const;
const DURATION = 900;

// The whole blue field holds, then fades to reveal the app underneath.
const overlayKeyframe = new Keyframe({
  0: { opacity: 1 },
  70: { opacity: 1 },
  100: { opacity: 0, easing: Easing.in(Easing.cubic) },
});

// The duck pops in with a slight overshoot, then drifts fractionally larger as the field
// fades — so it reads as one intentional beat rather than an image appearing late.
const duckKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.6 }] },
  35: { opacity: 1, transform: [{ scale: 1 }], easing: Easing.out(Easing.back(1.6)) },
  100: { opacity: 1, transform: [{ scale: 1.08 }], easing: Easing.in(Easing.cubic) },
});

/**
 * Covers the app until `ready`, then plays the duck in and fades away to reveal it. Owns
 * the only SplashScreen.hideAsync() call in the app — see the comment in app/_layout.tsx.
 */
export function AnimatedSplashOverlay({ ready }: { ready: boolean }) {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const backgroundColor = SPLASH_BACKGROUND[useSchemeName()];

  useEffect(() => {
    // Driven by an effect rather than onLayout: the overlay mounts on first render while
    // `ready` is still false, so an onLayout handler would fire once, too early, and never
    // run again when `ready` flips.
    if (ready && !animate) {
      SplashScreen.hideAsync().finally(() => setAnimate(true));
    }
  }, [ready, animate]);

  if (!visible) return null;

  // Until the native splash is hidden this is just a colour-matched backdrop with no duck:
  // the entrance would otherwise play unseen underneath the native splash and be over by
  // the time anyone could see it.
  if (!animate) {
    return <View style={[styles.splashOverlay, { backgroundColor }]} />;
  }

  return (
    <Animated.View
      pointerEvents="none"
      entering={overlayKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={[styles.splashOverlay, { backgroundColor }]}>
      <Animated.View entering={duckKeyframe.duration(DURATION)}>
        <MaterialCommunityIcons name="duck" size={112} color="#FFFFFF" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
