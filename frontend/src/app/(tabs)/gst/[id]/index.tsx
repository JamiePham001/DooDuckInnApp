import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";

import GstTable from "@/components/ui/gst-table";
import { ThemedView } from "@/components/themed-view";
import { formatDateRange } from "@/utils/format-date-range";
import { ThemedText } from "@/components/themed-text";

interface ITransactionRes {
  id: number;
  taxId: number;
  name: string;
  amount: number;
  gst: number;
  type: number;
}

interface ITaxReport {
  id: number;
  startDate: string;
  endDate: string;
}

// ponytail: "localhost" means the device itself on Android, not the host machine —
// the Android emulator maps the host's localhost to 10.0.2.2 instead. Swap for a real
// LAN IP (or an env-based config) once testing on a physical device.
const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export default function GstReportEditorPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taxId = Number(id);

  const [soldArr, setSoldArr] = useState<ITransactionRes[]>([]);
  const [purchaseArr, setPurchaseArr] = useState<ITransactionRes[]>([]);
  const [jwtToken, setJwtToken] = useState("");

  useEffect(() => {
    const getToken = async () => {
      try {
        const session = await fetchAuthSession();
        // The backend validates the JWT's `aud` claim against the Cognito app client —
        // Cognito's access token has no `aud` at all (only `client_id`), so it always
        // fails that check. The ID token carries both `aud` and `sub`.
        const token = session.tokens?.idToken?.toString();
        if (!token) throw new Error("No access token found");
        setJwtToken(token);
      } catch (err) {
        console.error("Error fetching JWT:", err);
        Alert.alert("Error", "Could not retrieve authentication token.");
      }
    };
    getToken();
  }, []);

  const fetchReport = async (): Promise<ITaxReport> => {
    const res = await fetch(`http://${API_HOST}:5010/api/taxes/${taxId}`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return await res.json();
  };

  const fetchTransactions = async (): Promise<ITransactionRes[]> => {
    const res = await fetch(
      `http://${API_HOST}:5010/api/taxes/${taxId}/transactions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  };

  const { data, isLoading, error } = useQuery<ITransactionRes[]>({
    queryKey: [`TransactionTaxId:${taxId}`, jwtToken],
    queryFn: () => fetchTransactions(),
    enabled: !!jwtToken,
    staleTime: 1000 * 60 * 5, // 5 minutes cache before refetch
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (renamed from cacheTime in v5)
  });

  const {
    data: taxData,
    isLoading: taxLoading,
    error: taxError,
  } = useQuery<ITaxReport>({
    queryKey: [`Tax:${taxId}`, jwtToken],
    queryFn: () => fetchReport(),
    enabled: !!jwtToken,
    staleTime: 1000 * 60 * 5, // 5 minutes cache before refetch
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (renamed from cacheTime in v5)
  });

  useEffect(() => {
    if (!data) return;
    setSoldArr(data.filter((obj) => obj.type == 0));
    setPurchaseArr(data.filter((obj) => obj.type == 1));
  }, [data]);

  if (isLoading || taxLoading)
    return (
      <ThemedView style={styles.reportContainer}>
        <ActivityIndicator />
      </ThemedView>
    );

  if (error || taxError)
    return (
      <ThemedView style={styles.reportContainer}>
        <ThemedText>Error loading data</ThemedText>
      </ThemedView>
    );
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Stack.Screen
        options={{
          title: taxData
            ? formatDateRange(taxData.startDate, taxData.endDate)
            : "",
        }}
      />
      <ThemedView
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: 20,
        }}
      >
        <Pressable style={styles.button}>
          <ThemedText>Scan</ThemedText>
        </Pressable>
        <Pressable style={styles.button}>
          <ThemedText>Send</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView
        style={{
          paddingHorizontal: 20,
          width: "100%",
        }}
      >
        <ThemedView style={styles.reportContainer}>
          <GstTable
            title="Sold"
            array={soldArr}
            jwtToken={jwtToken}
            taxId={taxId}
            transactionType={0}
          ></GstTable>
          <GstTable
            title="Purchases"
            array={purchaseArr}
            jwtToken={jwtToken}
            taxId={taxId}
            transactionType={1}
          ></GstTable>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  reportContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  button: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    color: "white",
  },
});
