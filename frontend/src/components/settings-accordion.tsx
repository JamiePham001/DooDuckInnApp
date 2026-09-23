import React, { type ComponentProps } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

import {
  BottomTabInset,
  Hairline,
  Motion,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function SettingsRow({
  icon,
  filledIcon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  filledIcon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  const colors = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.row}>
      {({ pressed }) => (
        <>
          <Ionicons
            name={pressed ? filledIcon : icon}
            size={20}
            color={pressed ? colors.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.text,
              { color: pressed ? colors.accent : colors.text },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SettingsAccordion({ visible, onClose }: Props) {
  const colors = useTheme();

  const style = useAnimatedStyle(() => ({
    // Content is a couple of fixed-height rows — a real max-content height, not "100%"
    // (which measures against the whole screen and overshoots). overflow:hidden on the
    // container clips them as this shrinks, instead of letting them poke out the
    // bottom and visually "bunch" into the tab bar mid-collapse.
    maxHeight: withTiming(visible ? 200 : 0, { duration: Motion.base }),
  }));

  const { signOut } = useAuthenticator();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          // A light sheet rather than the tab bar's blue: dark-on-white is far easier to
          // read than the pale-blue-on-blue it used to be. The shadow is what separates
          // it from the screen content it slides over.
          ...Shadow.raised,
        },
        style,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <SettingsRow
        icon="language-outline"
        filledIcon="language"
        label="Language"
        onPress={onClose}
      />
      <SettingsRow
        icon="log-out-outline"
        filledIcon="log-out"
        label="Log Out"
        onPress={signOut}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: BottomTabInset,
    borderTopWidth: Hairline,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  text: Typography.body,
});
