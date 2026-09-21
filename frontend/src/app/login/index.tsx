import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { signIn } from "aws-amplify/auth";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";

const USERNAME = process.env.EXPO_PUBLIC_LOGIN_USERNAME!;
const PIN_LENGTH = 6;
const PAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

export default function LoginScreen() {
  const theme = useTheme();
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
      setError(e instanceof Error ? e.message : "Sign in failed.");
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
      <ThemedText type="title" style={styles.title}>
        Doo Duck Inn
      </ThemedText>

      <View style={styles.dotsRow}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: theme.text },
              i < pin.length && { backgroundColor: theme.text },
            ]}
          />
        ))}
      </View>

      <ThemedText type="small" themeColor="text" style={styles.error}>
        {error}
      </ThemedText>

      <View style={styles.pad}>
        {PAD_KEYS.map((key, i) => (
          <Pressable
            key={i}
            style={[styles.key, key === "" && styles.keyHidden]}
            onPress={() => handleKeyPress(key)}
            disabled={key === "" || submitting}
          >
            <ThemedText type="title" style={styles.keyText}>
              {key === "del" ? "⌫" : key}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 100,
    gap: 50,
  },
  title: {
    textAlign: "center",
    fontSize: 30,
    paddingBottom: 85,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  error: {
    color: "#e5484d",
    textAlign: "center",
  },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: 300,
    alignSelf: "center",
  },
  key: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  keyHidden: {
    opacity: 0,
  },
  keyText: {
    fontSize: 28,
  },
});
