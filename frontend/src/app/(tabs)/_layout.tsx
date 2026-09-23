import React, { useState } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";

import { BottomTabInset, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

import { AnimatedTabItem } from "@/components/animated-tab-icon";
import { SettingsAccordion } from "@/components/settings-accordion";

export default function TabLayout() {
  const iconSize = 20;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const colors = useTheme();
  const { t } = useI18n();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabActive,
          tabBarInactiveTintColor: colors.tabInactive,
          tabBarShowLabel: false,
          sceneStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            ...Typography.heading,
            color: colors.text,
          },
          tabBarStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderTopWidth: 0,
            backgroundColor: colors.tabBar,
            height: BottomTabInset,
            paddingTop: Spacing.two,
            paddingHorizontal: Spacing.four,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: t("tabs.home"),
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabItem
                size={iconSize}
                name={focused ? "home" : "home-outline"}
                label={t("tabs.home")}
                color={color}
                focused={focused}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              setSettingsOpen(false);
            },
          }}
        />
        <Tabs.Screen
          name="gst"
          options={{
            title: t("tabs.gstHeader"),
            // "gst" has its own nested Stack (gst/_layout.tsx) that owns header
            // display per-screen (including the dynamic per-report title) — showing
            // a header here too would stack a second, static header on top of it.
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabItem
                size={iconSize}
                name={focused ? "archive" : "archive-outline"}
                label={t("tabs.gst")}
                color={color}
                focused={focused}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              setSettingsOpen(false);
            },
          }}
        />
        <Tabs.Screen
          name="order"
          options={{
            title: t("tabs.order"),
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabItem
                size={iconSize}
                name={focused ? "ticket" : "ticket-outline"}
                label={t("tabs.order")}
                color={color}
                focused={focused}
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              setSettingsOpen(false);
            },
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("tabs.settings"),
            tabBarIcon: () => (
              <AnimatedTabItem
                size={iconSize}
                name={settingsOpen ? "settings" : "settings-outline"}
                label={t("tabs.settings")}
                color={settingsOpen ? colors.tabActive : colors.tabInactive}
                focused={settingsOpen}
              />
            ),
          }}
          listeners={{
            // Settings isn't a real screen — pressing its tab just toggles the
            // accordion overlay instead of navigating, so it never gets a chance
            // to become the focused route (hence driving its icon off local state).
            tabPress: (e) => {
              e.preventDefault();
              setSettingsOpen((open) => !open);
            },
          }}
        />
      </Tabs>
      <SettingsAccordion
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </View>
  );
}
