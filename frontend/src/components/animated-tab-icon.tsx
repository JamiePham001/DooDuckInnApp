import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { Text } from "react-native";
import Animated, { useAnimatedStyle, withTiming } from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Motion, Typography } from "@/constants/theme";

type Props = {
  name: ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: ColorValue;
  size: number;
  focused: boolean;
};

export function AnimatedTabItem({ name, label, color, size, focused }: Props) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: withTiming(focused ? -3 : 0, { duration: Motion.fast }) },
    ],
  }));

  return (
    <Animated.View style={[{ alignItems: "center", minWidth: 64, gap: 2 }, style]}>
      <Ionicons name={name} color={color} size={size} />
      <Text style={{ ...Typography.caption, fontSize: 12, color }} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}
