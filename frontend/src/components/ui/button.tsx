import React from "react";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/themed-text";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Hairline, Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  style,
}: Props) {
  const colors = useTheme();
  const inactive = disabled || loading;

  const { backgroundColor, foreground, borderColor } = {
    primary: {
      backgroundColor: colors.accent,
      foreground: colors.textOnAccent,
      borderColor: "transparent",
    },
    secondary: {
      backgroundColor: colors.surface,
      foreground: colors.text,
      borderColor: colors.border,
    },
    danger: {
      backgroundColor: colors.critical,
      foreground: "#FFFFFF",
      borderColor: "transparent",
    },
  }[variant];

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={[
        styles.button,
        { backgroundColor, borderColor },
        inactive && styles.inactive,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={foreground} />
        ) : (
          <>
            {icon && <Ionicons name={icon} size={18} color={foreground} />}
            <ThemedText style={[styles.label, { color: foreground }]}>
              {title}
            </ThemedText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    // 48 keeps the tap target comfortable — this app's primary user is not young.
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: Hairline,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
  },
  label: { ...Typography.body, textAlign: "center" },
  inactive: { opacity: 0.5 },
});
