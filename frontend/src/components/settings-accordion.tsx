import React, { type ComponentProps } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

import { BottomTabInset, Spacing } from "@/constants/theme";

const ACTIVE_COLOR = "#ffffff";
const INACTIVE_COLOR = "#acc8ee";

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
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {({ pressed }) => (
        <>
          <Ionicons
            name={pressed ? filledIcon : icon}
            size={18}
            color={pressed ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          <Text style={[styles.text, pressed && styles.textPressed]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SettingsAccordion({ visible, onClose }: Props) {
  const style = useAnimatedStyle(() => ({
    // Content is 3 fixed-height rows — a real max-content height, not "100%" (which
    // measures against the whole screen and overshoots). overflow:hidden on the
    // container clips them as this shrinks, instead of letting them poke out the
    // bottom and visually "bunch" into the tab bar mid-collapse.
    maxHeight: withTiming(visible ? 200 : 0, { duration: 250 }),
  }));

  const { signOut } = useAuthenticator();

  return (
    <Animated.View
      style={[styles.container, style]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <SettingsRow
        icon="language-outline"
        filledIcon="language"
        label="Language"
        onPress={onClose}
      />
      <SettingsRow
        icon="person-circle-outline"
        filledIcon="person-circle"
        label="Personal Details"
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
    backgroundColor: "#1877F2",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  text: {
    color: INACTIVE_COLOR,
    fontSize: 18,
  },
  textPressed: {
    color: ACTIVE_COLOR,
  },
});
