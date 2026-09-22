import React from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";

export default function OrderLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Vendors" }} />
      <Stack.Screen name="create_vendor" options={{ title: "New Vendor" }} />
    </Stack>
  );
}
