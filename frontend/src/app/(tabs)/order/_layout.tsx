import React from "react";
import { Stack } from "expo-router";
import { Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

export default function OrderLayout() {
  const colors = useTheme();
  const { t } = useI18n();
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
      <Stack.Screen name="index" options={{ title: t("order.suppliersTitle") }} />
      <Stack.Screen
        name="create_vendor"
        options={{ title: t("order.newSupplierTitle") }}
      />
      <Stack.Screen name="[id]/index" options={{ title: "" }} />
      <Stack.Screen
        name="[id]/edit_vendor"
        options={{ title: t("order.editSupplierTitle") }}
      />
      <Stack.Screen
        name="[id]/send_order"
        options={{ title: t("order.sendOrderTitle") }}
      />
    </Stack>
  );
}
