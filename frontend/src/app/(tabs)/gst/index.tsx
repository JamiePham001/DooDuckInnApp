import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PressableScale } from "@/components/ui/pressable-scale";
import {
  BottomTabInset,
  Motion,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
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

function ReportRow({
  report,
  index,
  onDelete,
}: {
  report: ITaxReport;
  index: number;
  onDelete: () => void;
}) {
  const colors = useTheme();
  const router = useRouter();
  const sent = report.isSent;

  const [pressed, setPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(pressed ? 0.97 : 1, {
          duration: Motion.fast,
          easing: Motion.ease,
        }),
      },
    ],
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(Motion.base).delay(
        Math.min(index, 6) * Motion.stagger,
      )}
      style={animatedStyle}
    >
      <SwipeToDelete
        confirmMessage={`Delete the report for ${formatDateRange(report.startDate, report.endDate)}? This can't be undone.`}
        onDelete={onDelete}
        borderRadius={Radius.lg}
      >
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/gst/[id]",
              params: { id: report.id.toString() },
            })
          }
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        >
          <Card flat style={styles.row}>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle} numberOfLines={1}>
                {formatDateRange(report.startDate, report.endDate)}
              </ThemedText>
              <View
                style={[
                  styles.status,
                  {
                    backgroundColor: sent
                      ? colors.medium + "1A"
                      : colors.accentSoft,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.statusText,
                    { color: sent ? colors.medium : colors.accent },
                  ]}
                >
                  {sent ? "Sent" : "Draft"}
                </ThemedText>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </Card>
        </Pressable>
      </SwipeToDelete>
    </Animated.View>
  );
}

export default function GstListPage() {
  const colors = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const deleteReport = async (taxId: number) => {
    try {
      const res = await fetch(`http://${API_HOST}:5010/api/taxes/${taxId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!res.ok) throw new Error(`Failed to delete report: ${res.status}`);
      queryClient.setQueryData<ITaxReport[]>(["taxes", jwtToken], (current) =>
        current?.filter((r) => r.id !== taxId),
      );
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  const renderBody = () => {
    if (error) {
      return (
        <View style={styles.message}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={colors.critical}
          />
          <ThemedText style={styles.messageTitle}>
            Couldn&apos;t load reports
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.messageBody}>
            Check your connection and try again.
          </ThemedText>
        </View>
      );
    }

    if (isLoading || !jwtToken) {
      return (
        <View style={styles.list}>
          {[0, 1, 2].map((i) => (
            <Card key={i} flat style={[styles.row, styles.skeletonRow]} />
          ))}
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={styles.message}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={colors.border}
          />
          <ThemedText style={styles.messageTitle}>No reports yet</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.messageBody}>
            Create your first quarterly GST report.
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {data.map((report, index) => (
          <ReportRow
            key={report.id}
            report={report}
            index={index}
            onDelete={() => deleteReport(report.id)}
          />
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: BottomTabInset + Spacing.four },
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Reports</ThemedText>
          <Button
            title="New"
            icon="add"
            onPress={() => router.push({ pathname: "/gst/create_report" })}
          />
        </View>

        {renderBody()}
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
    gap: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  title: Typography.title,
  list: { gap: Spacing.two },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  rowText: { flexShrink: 1, gap: Spacing.one, alignItems: "flex-start" },
  rowTitle: Typography.bodyStrong,
  status: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  statusText: Typography.caption,
  skeletonRow: { height: 76 },
  message: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.six,
  },
  messageTitle: { ...Typography.title, textAlign: "center" },
  messageBody: { ...Typography.secondary, textAlign: "center" },
});
