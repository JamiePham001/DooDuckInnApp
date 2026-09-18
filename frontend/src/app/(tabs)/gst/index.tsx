import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";
import { formatDateRange } from "@/utils/format-date-range";

interface ITaxReport {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  isSent: boolean;
}

// ponytail: "localhost" means the device itself on Android, not the host machine —
// the Android emulator maps the host's localhost to 10.0.2.2 instead. Swap for a real
// LAN IP (or an env-based config) once testing on a physical device.
const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export default function GstListPage() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const router = useRouter();

  const [reports, setReports] = useState<ITaxReport[]>([]);
  const [jwtToken, setJwtToken] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const getToken = async () => {
      try {
        const session = await fetchAuthSession();
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
    if (!jwtToken) return;

    const fetchReports = async () => {
      try {
        const res = await fetch(`http://${API_HOST}:5010/api/taxes`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        setReports(await res.json());
      } catch (err) {
        console.error("Failed to fetch tax reports:", err);
      }
    };

    fetchReports();
  }, [jwtToken]);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const start = new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + 3);
      const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);

      const res = await fetch(`http://${API_HOST}:5010/api/taxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          dateStart: toDateOnly(start),
          dateEnd: toDateOnly(end),
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const tax: ITaxReport = await res.json();
      router.push({ pathname: "/gst/[id]", params: { id: tax.id.toString() } });
    } catch (err) {
      console.error("Failed to create tax report:", err);
      Alert.alert("Error", "Could not create a new GST report.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <ScrollView>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleCreate}
            disabled={creating}
          >
            <ThemedText>{creating ? "Creating..." : "New"}</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: "/gst/[id]",
                params: { id: report.id.toString() },
              })
            }
          >
            <ThemedText>
              {formatDateRange(report.startDate, report.endDate)}
            </ThemedText>
            <ThemedText style={{ color: colors.textSecondary }}>
              {report.isSent ? "Sent" : "Draft"}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
