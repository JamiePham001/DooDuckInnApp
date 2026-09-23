import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { signIn } from "aws-amplify/auth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PressableScale } from "@/components/ui/pressable-scale";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

const USERNAME = process.env.EXPO_PUBLIC_LOGIN_USERNAME!;
const PIN_LENGTH = 6;
const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ username: USERNAME, password: pin });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("login.signInFailed"));
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyPress(key: string) {
    if (submitting || key === "") return;
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => (p.length < PIN_LENGTH ? p + key : p));
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.brand}>
        <MaterialCommunityIcons name="duck" size={64} color={theme.accent} />
        <ThemedText style={styles.title}>{t("login.title")}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t("login.subtitle")}
        </ThemedText>
      </View>

      <View style={styles.dotsRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: theme.border },
              i < pin.length && {
                backgroundColor: theme.accent,
                borderColor: theme.accent,
              },
            ]}
          />
        ))}
      </View>

      <ThemedText style={[styles.error, { color: theme.critical }]}>
        {error}
      </ThemedText>

      <View style={styles.pad}>
        {PAD_KEYS.map((key, i) => (
          <PressableScale
            key={i}
            scaleTo={0.9}
            style={[
              styles.key,
              key !== "" && {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              key === "" && styles.keyHidden,
            ]}
            onPress={() => handleKeyPress(key)}
            disabled={key === "" || submitting}
          >
            <ThemedText style={styles.keyText}>
              {key === "del" ? "⌫" : key}
            </ThemedText>
          </PressableScale>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  brand: {
    alignItems: "center",
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
  title: { ...Typography.display, textAlign: "center" },
  subtitle: { ...Typography.secondary, textAlign: "center" },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.four,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  error: { ...Typography.secondary, textAlign: "center", minHeight: 21 },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.three,
    maxWidth: 300,
    alignSelf: "center",
  },
  key: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  keyHidden: { opacity: 0 },
  keyText: { ...Typography.display, fontWeight: "600" },
});
