import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { consumePendingScannedTransactionId } from "@/utils/scan-signal";
import GstTable from "@/components/ui/gst-table";
import { ThemedView } from "@/components/themed-view";
import { formatDateRange } from "@/utils/format-date-range";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthToken } from "@/hooks/use-auth-token";
import { API_HOST } from "@/constants/api";

interface ITransactionRes {
  id: number;
  taxId: number;
  name: string;
  amount: number | null;
  gst: number | null;
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

export default function GstReportEditorPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const taxId = Number(id);
  const router = useRouter();
  const colors = useTheme();
  const { t } = useI18n();

  const { jwtToken } = useAuthToken();

  const [soldArr, setSoldArr] = useState<ITransactionRes[]>([]);
  const [purchaseArr, setPurchaseArr] = useState<ITransactionRes[]>([]);
  const [sending, setSending] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [taxData, setTaxData] = useState<ITaxReport | null>(null);
  const [taxLoading, setTaxLoading] = useState(true);
  const [taxError, setTaxError] = useState(false);

  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [transactionsError, setTransactionsError] = useState(false);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!jwtToken || !taxId) return;

    const fetchReport = async () => {
      setTaxLoading(true);
      setTaxError(false);
      try {
        const res = await fetch(`http://${API_HOST}:5010/api/taxes/${taxId}`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        setTaxData(await res.json());
      } catch (err) {
        console.error("Failed to fetch tax report:", err);
        setTaxError(true);
      } finally {
        setTaxLoading(false);
      }
    };

    fetchReport();
  }, [jwtToken, taxId]);

  // Refetches on every screen focus, not just on mount — this is what refreshes
  // the tables when navigating back from camera.tsx after a scan, without needing
  // a caching library to bridge the two screens.
  useFocusEffect(
    useCallback(() => {
      if (!jwtToken || !taxId) return;

      const fetchTransactions = async () => {
        setTransactionsLoading(true);
        setTransactionsError(false);
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

          const data: ITransactionRes[] = await res.json();
          const sortedData = data.sort((a, b) => a.id - b.id);
          setSoldArr(sortedData.filter((obj) => obj.type == 0));
          setPurchaseArr(sortedData.filter((obj) => obj.type == 1));

          // Non-null only right after returning from a scan — camera.tsx sets
          // this immediately before calling router.back().
          const scannedId = consumePendingScannedTransactionId();
          if (scannedId !== null) setHighlightId(scannedId);
        } catch (err) {
          console.error("API call failed:", err);
          setTransactionsError(true);
        } finally {
          setTransactionsLoading(false);
        }
      };

      fetchTransactions();
    }, [jwtToken, taxId]),
  );

  // Clears the highlight after the pulse has had time to play, so it doesn't
  // linger (or reappear) on a later, unrelated focus of this screen.
  useEffect(() => {
    if (highlightId === null) return;
    const timer = setTimeout(() => setHighlightId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const sendReport = async () => {
    try {
      setSending(true);
      setModalVisible(!modalVisible);
      const res = await fetch(
        `http://${API_HOST}:5010/api/taxes/${taxId}/send-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            RecipientEmail: "jamie.pham@outlook.com",
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to send report.");
      }
    } catch (error) {
      console.error("Error sending report: ", error);
    } finally {
      setSending(false);
    }
  };

  const screenTitle = taxData
    ? formatDateRange(taxData.startDate, taxData.endDate)
    : "";

  if (transactionsLoading || taxLoading)
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: screenTitle }} />
        <ActivityIndicator />
      </ThemedView>
    );

  if (transactionsError || taxError)
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: screenTitle }} />
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={colors.critical}
        />
        <ThemedText style={styles.messageTitle}>
          {t("gst.loadDetailError")}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.messageBody}>
          {t("common.checkConnection")}
        </ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: screenTitle }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.actions}>
          <Button
            title={t("gst.scanButton")}
            icon="camera-outline"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/gst/[id]/camera",
                params: { id: id },
              })
            }
            loading={scanning}
            style={styles.action}
          />
          <Button
            title={t("gst.sendButton")}
            icon="paper-plane-outline"
            onPress={() => setModalVisible(true)}
            loading={sending}
            disabled={sending}
            style={styles.action}
          />
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
          style={{ backgroundColor: colors.background }}
        >
          <TouchableWithoutFeedback
            onPressOut={() => setModalVisible(!modalVisible)}
          >
            <View style={styles.centeredView}>
              <TouchableWithoutFeedback>
                <ThemedView
                  style={[
                    styles.modalView,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.text,
                    },
                  ]}
                >
                  <ThemedText style={[styles.modalHeading]}>
                    {t("gst.sendReportTitle")}
                  </ThemedText>
                  <ThemedText style={styles.modalText}>
                    {t("gst.sendReportConfirm")}
                  </ThemedText>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <Button
                      title={t("common.cancel")}
                      onPress={() => setModalVisible(!modalVisible)}
                      style={{ backgroundColor: colors.critical }}
                    />
                    <Button
                      title={t("gst.sendReportConfirmButton")}
                      onPress={sendReport}
                      disabled={sending}
                      style={{ backgroundColor: colors.medium }}
                    />
                  </View>
                </ThemedView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <GstTable
          title={t("gst.soldTable")}
          array={soldArr}
          jwtToken={jwtToken}
          taxId={taxId}
          transactionType={0}
          highlightId={highlightId}
        />
        <GstTable
          title={t("gst.purchasesTable")}
          array={purchaseArr}
          jwtToken={jwtToken}
          taxId={taxId}
          transactionType={1}
          highlightId={highlightId}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  action: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  messageTitle: { ...Typography.title, textAlign: "center" },
  messageBody: { ...Typography.secondary, textAlign: "center" },

  // modal
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    borderWidth: 1,
    borderStyle: "solid",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
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
  modalHeading: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    overflowY: "auto",
    height: 30,
  },
});
