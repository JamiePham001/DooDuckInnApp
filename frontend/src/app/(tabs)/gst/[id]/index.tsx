import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";

import GstTable from "@/components/ui/gst-table";
import { ThemedView } from "@/components/themed-view";
import { formatDateRange } from "@/utils/format-date-range";

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
  const [report, setReport] = useState<ITaxReport | null>(null);
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

  useEffect(() => {
    if (!jwtToken || !taxId) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`http://${API_HOST}:5010/api/taxes/${taxId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        setReport(await res.json());
      } catch (err) {
        console.error("Failed to fetch tax report:", err);
      }
    };

    fetchReport();
  }, [jwtToken, taxId]);

  useEffect(() => {
    if (!jwtToken || !taxId) return;

    const fetchTransactions = async () => {
      try {
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

        const data = await res.json();
        setSoldArr(data.filter((obj: ITransactionRes) => obj.type == 0));
        setPurchaseArr(data.filter((obj: ITransactionRes) => obj.type == 1));
      } catch (err) {
        console.error("API call failed:", err);
      }
    };

    fetchTransactions();
  }, [jwtToken, taxId]);

  return (
    <ScrollView>
      <Stack.Screen
        options={{ title: report ? formatDateRange(report.startDate, report.endDate) : "" }}
      />
      <ThemedView
        style={{
          flex: 1,
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
});
