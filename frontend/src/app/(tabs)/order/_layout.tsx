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
      <Stack.Screen name="index" options={{ title: "Suppliers" }} />
      <Stack.Screen name="create_vendor" options={{ title: "New Supplier" }} />
      <Stack.Screen name="[id]/index" options={{ title: "" }} />
      <Stack.Screen
        name="[id]/edit_vendor"
        options={{ title: "Edit Supplier" }}
      />
      <Stack.Screen name="[id]/send_order" options={{ title: "Send Order" }} />
    </Stack>
  );
}
