import React from "react";
import { Stack } from "expo-router";
import { Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function GstLayout() {
  const colors = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { ...Typography.heading, color: colors.text },
        headerTintColor: colors.accent,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "GST Reports" }} />
      <Stack.Screen name="create_report" options={{ title: "New Report" }} />
      <Stack.Screen name="[id]/index" options={{ title: "" }} />
      <Stack.Screen name="[id]/camera" options={{ title: "Scan" }} />
    </Stack>
  );
}
