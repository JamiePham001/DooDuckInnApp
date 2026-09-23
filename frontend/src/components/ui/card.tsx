import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Hairline, Radius, Shadow, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * The app's standard surface: a rounded, lifted panel on the grey canvas. Reads the
 * theme's `surface`, so unlike the hardcoded white it replaces it also works in dark mode.
 */
export function Card({
  style,
  flat = false,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  /** Drops the shadow. Needed inside SwipeToDelete, whose overflow:hidden clips it anyway. */
  flat?: boolean;
  children?: React.ReactNode;
}) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !flat && styles.lifted,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: Hairline,
    padding: Spacing.three,
  },
  lifted: Shadow.card,
});
