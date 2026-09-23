import React, { useState } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { Motion } from "@/constants/theme";

type Props = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** 1 = no scaling. Lower values press further in. */
  scaleTo?: number;
};

/**
 * Pressable with a springy scale-down on touch — the app's standard press feedback.
 * Drives the animation straight off React state rather than a shared value, matching
 * the idiom in animated-tab-icon.tsx.
 */
export function PressableScale({
  style,
  children,
  scaleTo = 0.97,
  disabled,
  ...rest
}: Props) {
  const [pressed, setPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(pressed && !disabled ? scaleTo : 1, {
          duration: Motion.fast,
          easing: Motion.ease,
        }),
      },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...rest}
        disabled={disabled}
        style={style}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
