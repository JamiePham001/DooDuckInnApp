import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

// Matches DigestPriority in the backend (src/digests/digests.model.cs) — serializes as its
// underlying int since no JsonStringEnumConverter is registered anywhere in this codebase.
enum DigestPriority {
  Critical = 0,
  High = 1,
  Medium = 2,
  Low = 3,
}

const PRIORITY_LABEL: Record<DigestPriority, string> = {
  [DigestPriority.Critical]: "Critical",
  [DigestPriority.High]: "High",
  [DigestPriority.Medium]: "Medium",
  [DigestPriority.Low]: "Low",
};

const PRIORITY_COLOR: Record<DigestPriority, string> = {
  [DigestPriority.Critical]: "#E53935",
  [DigestPriority.High]: "#FB8C00",
  [DigestPriority.Medium]: "#43A047",
  [DigestPriority.Low]: "#9E9E9E",
};

interface IDigestItem {
  id: number;
  gmailMessageId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  summary: string;
  priority: DigestPriority;
  receivedAt: string;
}

// ponytail: "localhost" means the device itself on Android, not the host machine —
// the Android emulator maps the host's localhost to 10.0.2.2 instead. Swap for a real
// LAN IP (or an env-based config) once testing on a physical device.
const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const fetchDigest = async (jwtToken: string): Promise<IDigestItem[]> => {
  const res = await fetch(`http://${API_HOST}:5010/api/digests/latest`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

export default function HomeScreen() {
  const [jwtToken, setJwtToken] = useState("");

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

  const { data, isLoading, error } = useQuery<IDigestItem[]>({
    queryKey: ["digests", jwtToken],
    queryFn: () => fetchDigest(jwtToken),
    enabled: !!jwtToken,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centered}>
        <Text>Error loading digest</Text>
      </ThemedView>
    );
  }

  if (!data || data.length === 0) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>No digest yet — check back tomorrow.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ThemedView style={styles.container}>
        {data.map((item) => (
          <ThemedView key={item.id} style={styles.row}>
            <ThemedView style={styles.rowHeader}>
              <ThemedText style={styles.senderName}>{item.senderName}</ThemedText>
              <ThemedText style={{ color: PRIORITY_COLOR[item.priority] }}>
                {PRIORITY_LABEL[item.priority]}
              </ThemedText>
            </ThemedView>
            <ThemedText style={styles.subject}>{item.subject}</ThemedText>
            <ThemedText style={styles.summary}>{item.summary}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  row: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  senderName: { fontWeight: "600" },
  subject: { fontSize: 13, opacity: 0.8 },
  summary: { fontSize: 13 },
});
