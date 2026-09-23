import React, { useEffect } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  Hairline,
  Motion,
  Radius,
  Shadow,
  Spacing,
  ThemeColor,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthToken } from "@/hooks/use-auth-token";
import { API_HOST } from "@/constants/api";

// Matches DigestPriority in the backend (src/digests/digests.model.cs) — serializes as its
// underlying int since no JsonStringEnumConverter is registered anywhere in this codebase.
enum DigestPriority {
  Critical = 0,
  High = 1,
  Medium = 2,
  Low = 3,
}

const PRIORITY_KEY: Record<DigestPriority, string> = {
  [DigestPriority.Critical]: "home.priority.critical",
  [DigestPriority.High]: "home.priority.high",
  [DigestPriority.Medium]: "home.priority.medium",
  [DigestPriority.Low]: "home.priority.low",
};

const PRIORITY_COLOR: Record<DigestPriority, ThemeColor> = {
  [DigestPriority.Critical]: "critical",
  [DigestPriority.High]: "high",
  [DigestPriority.Medium]: "medium",
  [DigestPriority.Low]: "low",
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

const fetchDigest = async (jwtToken: string): Promise<IDigestItem[]> => {
  const res = await fetch(`http://${API_HOST}:5010/api/digests/latest`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
};

function DigestCard({ item, index }: { item: IDigestItem; index: number }) {
  const colors = useTheme();
  const { t } = useI18n();
  const priorityColor = colors[PRIORITY_COLOR[item.priority]];

  return (
    <Animated.View
      // Delay is capped so a 30-email digest doesn't take 1.4s to finish appearing.
      entering={FadeInDown.duration(Motion.base).delay(
        Math.min(index, 6) * Motion.stagger,
      )}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.sender} numberOfLines={1}>
          {item.senderName}
        </ThemedText>
        <View
          style={[styles.pill, { backgroundColor: priorityColor + "1A" }]}
        >
          <ThemedText style={[styles.pillText, { color: priorityColor }]}>
            {t(PRIORITY_KEY[item.priority])}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.subject} numberOfLines={1}>
        {item.subject}
      </ThemedText>
      <ThemedText
        themeColor="textSecondary"
        style={styles.summary}
        numberOfLines={3}
      >
        {item.summary}
      </ThemedText>
    </Animated.View>
  );
}

function LoadingSkeleton() {
  const colors = useTheme();
  const progress = useSharedValue(0.4);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 700, easing: Motion.ease }),
      -1,
      true,
    );
  }, [progress]);

  const pulse = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pulse,
          ]}
        >
          {(["45%", "80%", "95%"] as const).map((width) => (
            <View
              key={width}
              style={[
                styles.skeletonBar,
                { width, backgroundColor: colors.surfacePressed },
              ]}
            />
          ))}
        </Animated.View>
      ))}
    </>
  );
}

function CenteredMessage({
  icon,
  iconColor,
  title,
  body,
  action,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  const colors = useTheme();

  return (
    <View style={styles.centered}>
      <MaterialCommunityIcons name={icon} size={72} color={iconColor} />
      <ThemedText type="subtitle" style={styles.centeredTitle}>
        {title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.centeredBody}>
        {body}
      </ThemedText>
      {action && (
        <Pressable
          onPress={action.onPress}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: pressed ? colors.accentPressed : colors.accent,
            },
          ]}
        >
          <ThemedText themeColor="textOnAccent" style={styles.buttonText}>
            {action.label}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useTheme();
  const { t } = useI18n();
  const { jwtToken, tokenError } = useAuthToken();

  const { data, isLoading, error, refetch } = useQuery<IDigestItem[]>({
    queryKey: ["digests", jwtToken],
    queryFn: () => fetchDigest(jwtToken),
    enabled: !!jwtToken,
    staleTime: 1000 * 60 * 5,
  });

  const needsAttention =
    data?.filter((d) => d.priority <= DigestPriority.High).length ?? 0;

  const renderBody = () => {
    if (error || tokenError) {
      return (
        <CenteredMessage
          icon="alert-circle-outline"
          iconColor={colors.critical}
          title={t("home.loadError")}
          body={t("common.checkConnection")}
          action={{ label: t("common.tryAgain"), onPress: () => refetch() }}
        />
      );
    }

    if (isLoading || !jwtToken) return <LoadingSkeleton />;

    if (!data || data.length === 0) {
      return (
        <CenteredMessage
          icon="duck"
          iconColor={colors.border}
          title={t("home.allClear")}
          body={t("home.noAttention")}
        />
      );
    }

    return data.map((item, index) => (
      <DigestCard key={item.id} item={item} index={index} />
    ));
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
          <MaterialCommunityIcons name="duck" size={28} color={colors.accent} />
          <View>
            <ThemedText type="subtitle" style={styles.headerTitle}>
              {t("home.title")}
            </ThemedText>
            {!!data?.length && (
              <ThemedText themeColor="textSecondary" style={styles.headerMeta}>
                {t("home.emailCount", { count: data.length })}
                {needsAttention > 0 &&
                  ` ${t("home.needAttention", { count: needsAttention })}`}
              </ThemedText>
            )}
          </View>
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
    gap: Spacing.two,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  headerTitle: Typography.title,
  headerMeta: Typography.secondary,

  card: {
    borderRadius: Radius.lg,
    borderWidth: Hairline,
    padding: Spacing.three,
    gap: Spacing.one,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  sender: { ...Typography.bodyStrong, flexShrink: 1 },
  subject: Typography.body,
  summary: Typography.secondary,

  // A tinted pill rather than bare coloured text: it reads as a status at a glance, and
  // putting the colour on its own background sidesteps small-text contrast problems.
  pill: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  pillText: Typography.caption,

  skeletonBar: { height: 12, borderRadius: Radius.sm },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centeredTitle: { ...Typography.title, textAlign: "center" },
  centeredBody: { ...Typography.secondary, textAlign: "center" },
  button: {
    marginTop: Spacing.two,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: Spacing.five,
    borderRadius: Radius.pill,
  },
  buttonText: { ...Typography.body, textAlign: "center" },
});
