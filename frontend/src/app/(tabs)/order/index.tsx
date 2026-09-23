import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
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
import { useI18n } from "@/hooks/use-i18n";
import { useAuthToken } from "@/hooks/use-auth-token";
import { API_HOST } from "@/constants/api";

interface ISupplier {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
}


const fetchSuppliers = async (jwtToken: string): Promise<ISupplier[]> => {
  const res = await fetch(`http://${API_HOST}:5010/api/users/me/suppliers`, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
};

function SupplierRow({
  supplier,
  index,
  jwtToken,
}: {
  supplier: ISupplier;
  index: number;
  jwtToken: string;
}) {
  const colors = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();

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

  const deleteSupplier = async (id: number, jwtToken: string) => {
    try {
      const res = await fetch(`http://${API_HOST}:5010/api/suppliers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!res.ok) throw new Error(`Failed to delete supplier: ${res.status}`);

      queryClient.setQueryData<ISupplier[]>(
        ["suppliers", jwtToken],
        (current) => current?.filter((s) => s.id != id),
      );
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch (error) {
      console.error("Failed to delete report:", error);
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(Motion.base).delay(
        Math.min(index, 6) * Motion.stagger,
      )}
      style={animatedStyle}
    >
      <SwipeToDelete
        confirmMessage={t("order.deleteSupplierConfirm", { name: supplier.name })}
        onDelete={() => deleteSupplier(supplier.id, jwtToken)}
        borderRadius={Radius.lg}
      >
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/order/[id]",
              params: { id: supplier.id.toString() },
            })
          }
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
        >
          <Card flat style={styles.row}>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle} numberOfLines={1}>
                {supplier.name}
              </ThemedText>
              {!!supplier.email && (
                <ThemedText
                  themeColor="textSecondary"
                  style={styles.rowMeta}
                  numberOfLines={1}
                >
                  {supplier.email}
                </ThemedText>
              )}
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

export default function OrderPage() {
  const { jwtToken } = useAuthToken();
  const router = useRouter();
  const colors = useTheme();
  const { t } = useI18n();

  const { data, isLoading, error } = useQuery<ISupplier[]>({
    // Was "taxes" — the exact same key (and same jwtToken) as the GST report
    // list's query, so both would have collided in the shared QueryClient's
    // cache and overwritten each other's data.
    queryKey: ["suppliers", jwtToken],
    queryFn: () => fetchSuppliers(jwtToken),
    enabled: !!jwtToken,
    staleTime: 1000 * 60 * 5, // 5 minutes cache before refetch
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (renamed from cacheTime in v5)
  });

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
            {t("order.loadError")}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.messageBody}>
            {t("common.checkConnection")}
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
          <Ionicons name="storefront-outline" size={64} color={colors.border} />
          <ThemedText style={styles.messageTitle}>
            {t("order.emptyTitle")}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.messageBody}>
            {t("order.emptyBody")}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {data.map((supplier, index) => (
          <SupplierRow
            key={supplier.id}
            supplier={supplier}
            index={index}
            jwtToken={jwtToken}
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
          <ThemedText style={styles.title}>{t("order.suppliersTitle")}</ThemedText>
          <Button
            title={t("common.new")}
            icon="add"
            onPress={() => router.push({ pathname: "/order/create_vendor" })}
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
  rowText: { flexShrink: 1, gap: 2 },
  rowTitle: Typography.bodyStrong,
  rowMeta: Typography.secondary,
  skeletonRow: { height: 72 },
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
