import React, { Dispatch } from "react";
import { TextInput, View } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";

import { useEffect, useRef, useState } from "react";

import { SwipeToDelete } from "@/components/swipe-to-delete";
import { PressableScale } from "@/components/ui/pressable-scale";
import {
  Hairline,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { API_HOST } from "@/constants/api";

interface ITransactionRes {
  id: number;
  taxId: number;
  name: string;
  amount: number | null;
  gst: number | null;
  type: number;
}

interface TableProps {
  title: string;
  array: ITransactionRes[];
  jwtToken: string;
  transactionType: number;
  taxId: number;
  highlightId?: number | null;
}

function PulsingRow({
  highlighted,
  children,
}: {
  highlighted: boolean;
  children: React.ReactNode;
}) {
  const colors = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (highlighted) {
      // Pulses 3 times (~2.4s total) then settles back to the normal row color.
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 }),
        ),
        3,
        false,
      );
    }
  }, [highlighted, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.surface, colors.accentSoft],
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.tableRow,
        { borderTopColor: colors.border },
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

function useCellStyle(flex: number) {
  const colors = useTheme();
  return {
    flex,
    textAlign: "left" as const,
    color: colors.text,
    ...Typography.secondary,
  };
}

function DebouncedNameInput({
  initialName,
  onSave,
}: {
  initialName: string;
  onSave: (name: string) => Promise<Response>;
}) {
  const colors = useTheme();
  const { t } = useI18n();
  const style = useCellStyle(2);
  const [name, setName] = useState(initialName);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(text: string) {
    const previousValue = name;
    setName(text); // updates instantly — the input never feels laggy

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await onSave(text); // fires only after ~600ms of no further typing
        if (!res.ok) {
          throw new Error("Failed to update amount");
        }
      } catch {
        setName(previousValue);
        // network failure — same rollback, since the edit never reached the backend
      }
    }, 600);
  }

  return (
    <TextInput
      value={name}
      onChangeText={handleChange}
      placeholder={t("gst.table.namePlaceholder")}
      placeholderTextColor={colors.textSecondary}
      style={style}
    />
  );
}

// Blank means "not entered yet", not 0 — parses an empty/whitespace cell to null instead of
// coercing it to a real 0 value, which is what used to fight the user for every cleared cell.
function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : parseFloat(trimmed);
}

function DebouncedAmountInput({
  initialAmount,
  onSave,
  amountId,
  setArray,
}: {
  initialAmount: number | null;
  onSave: (amount: number | null) => Promise<Response>;
  amountId: number;
  setArray: Dispatch<React.SetStateAction<ITransactionRes[]>>;
}) {
  const colors = useTheme();
  const style = useCellStyle(1);
  // Kept as a raw string, not a number — coercing on every keystroke (e.g. +"12.")
  // drops the trailing "." before the user can type a decimal digit after it.
  const [text, setText] = useState(initialAmount?.toString() ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    const previousValue = text;
    setText(value); // updates instantly — the input never feels laggy
    const parsed = parseAmount(value);
    setArray((prev) =>
      prev.map((obj) =>
        obj.id === amountId ? { ...obj, amount: parsed } : obj,
      ),
    );

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        if (parsed !== null && Number.isNaN(parsed)) {
          throw new Error("Amount failed to parse");
        }
        const res = await onSave(parsed); // fires only after ~600ms of no further typing
        if (!res.ok) {
          throw new Error("Failed to update amount");
        }
      } catch {
        setText(previousValue);
        setArray((prev) =>
          prev.map((obj) =>
            obj.id === amountId ? { ...obj, amount: parseAmount(previousValue) } : obj,
          ),
        );
      }
    }, 600);
  }

  return (
    <TextInput
      value={text}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      placeholder="0"
      placeholderTextColor={colors.textSecondary}
      style={style}
    />
  );
}

function DebouncedGstInput({
  initialGst,
  onSave,
}: {
  initialGst: number | null;
  onSave: (gst: number | null) => Promise<Response>;
}) {
  const colors = useTheme();
  const style = useCellStyle(1);
  // Kept as a raw string, not a number — coercing on every keystroke (e.g. +"12.")
  // drops the trailing "." before the user can type a decimal digit after it.
  const [text, setText] = useState(initialGst?.toString() ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    const previousValue = text;
    setText(value); // updates instantly — the input never feels laggy

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const parsed = parseAmount(value);
        if (parsed !== null && Number.isNaN(parsed)) {
          throw new Error("Amount failed to parse");
        }
        const res = await onSave(parsed); // fires only after ~600ms of no further typing

        if (!res.ok) {
          throw new Error("Failed to update amount");
        }
      } catch {
        setText(previousValue);
      }
    }, 600);
  }

  return (
    <TextInput
      value={text}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      placeholder="0"
      placeholderTextColor={colors.textSecondary}
      style={style}
    />
  );
}

const GstTable = ({
  title,
  array,
  jwtToken,
  taxId,
  transactionType,
  highlightId,
}: TableProps) => {
  const colors = useTheme();
  const { t } = useI18n();
  const [tableArray, setTableArray] = useState(array);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    setTableArray(array);
  }, [array]);

  const addRow = async () => {
    try {
      setCreating(true);
      const res = await fetch(
        `http://${API_HOST}:5010/api/taxes/${taxId}/transactions`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            taxId,
            name: "",
            amount: null,
            gst: null,
            type: transactionType,
          }),
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to create transaction: ${res.status}`);
      }
      const transaction = await res.json();
      setTableArray([...tableArray, transaction]);
    } catch (error) {
      console.error("Failed to add row:", error);
    } finally {
      setCreating(false);
    }
  };

  const deleteRow = async (transactionId: number) => {
    try {
      const res = await fetch(
        `http://${API_HOST}:5010/api/transactions/${transactionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jwtToken}` },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to delete transaction: ${res.status}`);
      }
      setTableArray((current) => current.filter((t) => t.id !== transactionId));
    } catch (error) {
      console.error("Failed to delete row:", error);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sectionTotal}>
          ${tableArray.reduce((sum, t) => sum + (t.amount || 0), 0).toFixed(2)}
        </ThemedText>
      </View>

      <ThemedView
        style={[
          styles.tableContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedView
          style={[
            styles.tableRow,
            styles.headerRow,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <ThemedText themeColor="textSecondary" style={styles.headerCell2}>
            {t("common.nameColumn")}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.headerCell1}>
            {t("gst.table.amount")}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.headerCell1}>
            {t("gst.table.gst")}
          </ThemedText>
        </ThemedView>

        {tableArray.map((transaction) => (
          <SwipeToDelete
            key={transaction.id}
            confirmMessage={t("common.deleteNamedConfirm", {
              name: transaction.name || t("gst.unnamedTransaction"),
            })}
            onDelete={() => deleteRow(transaction.id)}
            borderRadius={0}
          >
            <PulsingRow highlighted={transaction.id === highlightId}>
              <DebouncedNameInput
                initialName={transaction.name}
                onSave={(name) =>
                  fetch(
                    `http://${API_HOST}:5010/api/transactions/${transaction.id}/update/name?name=${encodeURIComponent(name)}`,
                    {
                      method: "PATCH",
                      headers: { Authorization: `Bearer ${jwtToken}` },
                    },
                  )
                }
              />
              <DebouncedAmountInput
                initialAmount={transaction.amount}
                amountId={transaction.id}
                setArray={setTableArray}
                onSave={(amount) =>
                  fetch(
                    `http://${API_HOST}:5010/api/transactions/${transaction.id}/update/amount${
                      amount === null ? "" : `?amount=${encodeURIComponent(amount)}`
                    }`,
                    {
                      method: "PATCH",
                      headers: { Authorization: `Bearer ${jwtToken}` },
                    },
                  )
                }
              />
              <DebouncedGstInput
                initialGst={transaction.gst}
                onSave={(gst) =>
                  fetch(
                    `http://${API_HOST}:5010/api/transactions/${transaction.id}/update/gst${
                      gst === null ? "" : `?gst=${encodeURIComponent(gst)}`
                    }`,
                    {
                      method: "PATCH",
                      headers: { Authorization: `Bearer ${jwtToken}` },
                    },
                  )
                }
              />
            </PulsingRow>
          </SwipeToDelete>
        ))}

        <PressableScale
          style={[
            styles.addRow,
            {
              backgroundColor: colors.accentSoft,
              borderTopColor: colors.border,
            },
          ]}
          onPress={addRow}
          disabled={creating}
        >
          <Ionicons name="add" size={18} color={colors.accent} />
          <ThemedText style={[styles.addRowText, { color: colors.accent }]}>
            {t("gst.table.addRow")}
          </ThemedText>
        </PressableScale>
      </ThemedView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { width: "100%", gap: Spacing.two },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.one,
  },
  sectionTitle: Typography.heading,
  sectionTotal: Typography.bodyStrong,
  tableContainer: {
    width: "100%",
    borderRadius: Radius.lg,
    borderWidth: Hairline,
    overflow: "hidden",
    ...Shadow.card,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: Hairline,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    gap: Spacing.two,
  },
  // The first row has nothing above it to divide from.
  headerRow: { borderTopWidth: 0 },
  headerCell2: { ...Typography.caption, flex: 2, textAlign: "left" },
  headerCell1: { ...Typography.caption, flex: 1, textAlign: "left" },
  addRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    minHeight: 44,
    borderTopWidth: Hairline,
  },
  addRowText: Typography.caption,
});

export default GstTable;
