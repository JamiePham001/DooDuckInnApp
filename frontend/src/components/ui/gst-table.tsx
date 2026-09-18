import React from "react";
import { TextInput, TouchableOpacity, Platform } from "react-native";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { StyleSheet } from "react-native";

import { useRef, useState } from "react";

interface ITransactionRes {
  id: number;
  taxId: number;
  name: string;
  amount: number;
  gst: number;
  type: number;
}

interface TableProps {
  title: string;
  array: ITransactionRes[];
  jwtToken: string;
  transactionType: number;
  taxId: number;
}

function DebouncedNameInput({
  initialName,
  onSave,
}: {
  initialName: string;
  onSave: (name: string) => Promise<Response>;
}) {
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
          setName(previousValue);
          // set up a real time notification that lets the user know the name change failed
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
      style={{ flex: 2, textAlign: "left", fontSize: 12 }}
    />
  );
}

function DebouncedAmountInput({
  initialAmount,
  onSave,
}: {
  initialAmount: number;
  onSave: (amount: number) => void;
}) {
  // Kept as a raw string, not a number — coercing on every keystroke (e.g. +"12.")
  // drops the trailing "." before the user can type a decimal digit after it.
  const [text, setText] = useState(initialAmount.toString());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setText(value); // updates instantly — the input never feels laggy

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) onSave(parsed); // fires only after ~600ms of no further typing
    }, 600);
  }

  return (
    <TextInput
      value={text}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      style={{ flex: 1, textAlign: "left", fontSize: 12 }}
    />
  );
}

function DebouncedGstInput({
  initialGst,
  onSave,
}: {
  initialGst: number;
  onSave: (gst: number) => void;
}) {
  // Kept as a raw string, not a number — coercing on every keystroke (e.g. +"12.")
  // drops the trailing "." before the user can type a decimal digit after it.
  const [text, setText] = useState(initialGst.toString());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setText(value); // updates instantly — the input never feels laggy

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) onSave(parsed); // fires only after ~600ms of no further typing
    }, 600);
  }

  return (
    <TextInput
      value={text}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      style={{ flex: 1, textAlign: "left", fontSize: 12 }}
    />
  );
}

const GstTable = ({
  title,
  array,
  jwtToken,
  taxId,
  transactionType,
}: TableProps) => {
  const [tableArray, setTableArray] = useState(array);
  const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
  const addRow = async () => {
    try {
      const res = await fetch(
        `http://${API_HOST}:5010/api/taxes/${taxId}?type=${encodeURIComponent(transactionType)}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
        },
      );
      if (!res.ok) {
        throw new Error(`Failed to create transaction: ${res.status}`);
      }
    } catch (error) {}
  };
  return (
    <ThemedView style={{ width: "100%", gap: 5 }}>
      <ThemedView style={styles.tableContainer}>
        <ThemedView style={styles.tableName}>
          <ThemedText>{title}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.tableRow}>
          <ThemedText style={{ flex: 2, textAlign: "left" }}>Name</ThemedText>
          <ThemedText style={{ flex: 1, textAlign: "left" }}>Amount</ThemedText>
          <ThemedText style={{ flex: 1, textAlign: "left" }}>GST</ThemedText>
        </ThemedView>
        {array.map((transaction) => (
          <ThemedView style={styles.tableRow} key={transaction.id}>
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
            ></DebouncedNameInput>
            <DebouncedAmountInput
              initialAmount={transaction.amount}
              onSave={(amount) =>
                fetch(
                  `http://${API_HOST}:5010/api/transactions/${transaction.id}/update/amount?amount=${encodeURIComponent(amount)}`,
                  {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${jwtToken}` },
                  },
                )
              }
            ></DebouncedAmountInput>
            <DebouncedGstInput
              initialGst={transaction.gst}
              onSave={(gst) =>
                fetch(
                  `http://${API_HOST}:5010/api/transactions/${transaction.id}/update/gst?gst=${encodeURIComponent(gst)}`,
                  {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${jwtToken}` },
                  },
                )
              }
            ></DebouncedGstInput>
          </ThemedView>
        ))}
        <TouchableOpacity style={styles.tableBtn} onPress={addRow}>
          <ThemedText>+</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
  },
  tableName: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    height: 45,
  },
  tableRow: {
    backgroundColor: "white",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
    height: 45,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  tableBtn: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 30,
    backgroundColor: "#1877F2",
  },
});

export default GstTable;
