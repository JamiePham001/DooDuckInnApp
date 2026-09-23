import React from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Hairline, Radius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

/** Labelled text field on the app's surface colour. Replaces the hand-rolled
 *  grey-bordered TextInput repeated across the create/edit forms. */
export function Input({ label, error, style, multiline, ...rest }: Props) {
  const colors = useTheme();

  return (
    <View style={styles.wrapper}>
      {!!label && (
        <ThemedText themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        multiline={multiline}
        style={[
          styles.input,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.critical : colors.border,
            color: colors.text,
          },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
      {!!error && (
        <ThemedText style={[styles.error, { color: colors.critical }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", gap: Spacing.one },
  label: Typography.caption,
  input: {
    minHeight: 52,
    borderWidth: Hairline,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    ...Typography.body,
  },
  multiline: {
    minHeight: 110,
    paddingTop: Spacing.two,
    textAlignVertical: "top",
  },
  error: Typography.caption,
});
