import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
} from "react-native";
import { router, useRouter } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";

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

const fetchReports = async (jwtToken: string): Promise<ITaxReport[]> => {
  const res = await fetch(`http://${API_HOST}:5010/api/taxes`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

const Reports = () => {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  const router = useRouter();
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

  // queryFn is called with a TanStack-supplied context object, not custom args —
  // jwtToken is captured via closure instead, and included in queryKey so a token
  // refresh (e.g. after re-login) correctly triggers a refetch instead of serving
  // a cached result fetched under the old token.
  const { data, isLoading, error } = useQuery<ITaxReport[]>({
    queryKey: ["taxes", jwtToken],
    queryFn: () => fetchReports(jwtToken),
    enabled: !!jwtToken,
    staleTime: 1000 * 60 * 5, // 5 minutes cache before refetch
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (renamed from cacheTime in v5)
  });

  if (isLoading) {
    return (
      <ThemedView
        style={{
          width: "100%",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView
        style={{
          width: "100%",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Error loading data</Text>
      </ThemedView>
    );
  }

  return (
    <>
      {data?.length == 0 ? (
        <ThemedView
          style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedText>Press "New" to create your first report</ThemedText>
        </ThemedView>
      ) : (
        <ThemedView
          style={{
            alignSelf: "flex-start",
            width: "100%",
            gap: 5,
          }}
        >
          {data?.map((report) => (
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
      )}
    </>
  );
};

export default function GstListPage() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.headerRow}>
          <Pressable
            style={styles.button}
            onPress={() => router.push({ pathname: "/gst/create_report" })}
            // disabled={creating}
          >
            <ThemedText>New</ThemedText>
          </Pressable>
        </ThemedView>
        <Reports />
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
    justifyContent: "flex-end",
  },
  button: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    color: "white",
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
});
