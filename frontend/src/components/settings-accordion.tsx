import React, { type ComponentProps } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

import {
  BottomTabInset,
  Hairline,
  Motion,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { LOCALES, type Locale } from "@/i18n";

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
  const colors = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.row}>
      {({ pressed }) => (
        <>
          <Ionicons
            name={pressed ? filledIcon : icon}
            size={20}
            color={pressed ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.text,
              { color: pressed ? colors.tabActive : colors.tabInactive },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SettingsAccordion({ visible, onClose }: Props) {
  const colors = useTheme();
  const { t, locale, setLocale } = useI18n();

  const style = useAnimatedStyle(() => ({
    // Content is a couple of fixed-height rows — a real max-content height, not "100%"
    // (which measures against the whole screen and overshoots). overflow:hidden on the
    // container clips them as this shrinks, instead of letting them poke out the
    // bottom and visually "bunch" into the tab bar mid-collapse.
    maxHeight: withTiming(visible ? 200 : 0, { duration: Motion.base }),
  }));

  const { signOut } = useAuthenticator();

  // A native Alert with one button per language is enough for a 2-item picker —
  // no reason to build a custom modal for this. Names are shown in each language's
  // own script (e.g. "Tiếng Việt"), not translated, matching every OS's own picker.
  const chooseLanguage = () => {
    onClose();
    Alert.alert(t("settings.chooseLanguage"), undefined, [
      ...(Object.entries(LOCALES) as [Locale, string][]).map(
        ([code, name]) => ({
          text: code === locale ? `✓ ${name}` : name,
          onPress: () => setLocale(code),
        }),
      ),
      { text: t("common.cancel"), style: "cancel" as const },
    ]);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        style,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <SettingsRow
        icon="language-outline"
        filledIcon="language"
        label={t("settings.language")}
        onPress={chooseLanguage}
      />
      <SettingsRow
        icon="log-out-outline"
        filledIcon="log-out"
        label={t("settings.logOut")}
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
    borderTopWidth: Hairline,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  text: Typography.body,
});
