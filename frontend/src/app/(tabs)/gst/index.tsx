import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  View,
  Pressable,
  Text,
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
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

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
    setLoading(true);
    const fetchReports = async () => {
      try {
        const res = await fetch(`http://${API_HOST}:5010/api/taxes`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        setReports(await res.json());
      } catch (err) {
        console.error("Failed to fetch tax reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [jwtToken]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      {loading ? (
        <ThemedView
          style={{ justifyContent: "center", alignItems: "center", flex: 1 }}
        >
          <ActivityIndicator />
        </ThemedView>
      ) : (
        <ThemedView style={styles.container}>
          <ThemedView style={styles.headerRow}>
            <Pressable
              style={styles.button}
              onPress={() => router.push({ pathname: "/gst/create_report" })}
              // disabled={creating}
            >
              <ThemedText>New</ThemedText>
            </Pressable>
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                // Alert.alert("Modal has been closed.");
                setModalVisible(!modalVisible);
              }}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <ThemedView>
                    <ThemedText>GST Report Details</ThemedText>
                  </ThemedView>
                  <ThemedView>
                    <ThemedText>Dates go here</ThemedText>
                  </ThemedView>
                  <ThemedView
                    style={{
                      justifyContent: "space-between",
                      flexDirection: "row",
                    }}
                  >
                    <Pressable
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => setModalVisible(!modalVisible)}
                    >
                      <Text style={styles.textStyle}>Hide Modal</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.button, styles.buttonClose]}
                      onPress={() => setModalVisible(!modalVisible)}
                    >
                      <Text style={styles.textStyle}>Create</Text>
                    </Pressable>
                  </ThemedView>
                </View>
              </View>
            </Modal>
          </ThemedView>

          {reports.length == 0 ? (
            <ThemedView>
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
          )}
        </ThemedView>
      )}
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
