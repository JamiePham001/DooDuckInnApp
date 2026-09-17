import React, { useState } from "react";
import { View } from "react-native";
import { Tabs } from "expo-router";

import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";

import { AnimatedTabItem } from "@/components/animated-tab-icon";
import { SettingsAccordion } from "@/components/settings-accordion";

export default function TabLayout() {
  const iconSize = 20;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tabText,
          tabBarInactiveTintColor: colors.inactive,
          tabBarShowLabel: false,
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: {
            fontWeight: "100",
            color: "#5f5f5f",
          },
          tabBarStyle: {
            elevation: 0,
            shadowOpacity: 0,
            borderTopWidth: 0,
            backgroundColor: "#1877F2",
            paddingTop: 10,
            paddingHorizontal: 20,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabItem
                size={iconSize}
                name={focused ? "home" : "home-outline"}
                label="Home"
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
            title: "GST",
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabItem
                size={iconSize}
                name={focused ? "archive" : "archive-outline"}
                label="GST"
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
            title: "Order",
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabItem
                size={iconSize}
                name={focused ? "ticket" : "ticket-outline"}
                label="Order"
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
            title: "Settings",
            tabBarIcon: () => (
              <AnimatedTabItem
                size={iconSize}
                name={settingsOpen ? "settings" : "settings-outline"}
                label="Settings"
                color={settingsOpen ? colors.tabText : colors.inactive}
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
