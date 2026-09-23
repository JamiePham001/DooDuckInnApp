import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Not normally reachable: the Settings tab's listener calls preventDefault() and opens
 * SettingsAccordion instead of navigating here (see (tabs)/_layout.tsx). The route has to
 * exist for the tab to be registered, so this is the fallback if it is ever navigated to
 * directly.
 */
export default function SettingsPage() {
  const colors = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <MaterialCommunityIcons name="duck" size={72} color={colors.border} />
      <ThemedText style={styles.title}>Settings</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.body}>
        Tap the Settings tab again to open the menu.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  title: { ...Typography.title, textAlign: "center" },
  body: { ...Typography.secondary, textAlign: "center" },
});
