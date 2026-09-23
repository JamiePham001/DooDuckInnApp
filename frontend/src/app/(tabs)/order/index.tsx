import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";
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

interface ISupplier {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
}

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const fetchSuppliers = async (jwtToken: string): Promise<ISupplier[]> => {
  const res = await fetch(`http://${API_HOST}:5010/api/users/me/suppliers`, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
};

// TODO: still a no-op — swiping a supplier row confirms, then does nothing. Pre-existing
// gap, left alone here because wiring up the DELETE is a behaviour change, not a restyle.
const deleteSupplier = (id: number) => {};

function SupplierRow({
  supplier,
  index,
}: {
  supplier: ISupplier;
  index: number;
}) {
  const colors = useTheme();
  const router = useRouter();

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
        confirmMessage={`Delete the supplier ${supplier.name}? This can't be undone.`}
        onDelete={() => deleteSupplier(supplier.id)}
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
  const [jwtToken, setJwtToken] = useState("");
  const router = useRouter();
  const colors = useTheme();

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
            Couldn&apos;t load suppliers
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
          <Ionicons name="storefront-outline" size={64} color={colors.border} />
          <ThemedText style={styles.messageTitle}>No suppliers yet</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.messageBody}>
            Add a supplier to start building orders.
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {data.map((supplier, index) => (
          <SupplierRow key={supplier.id} supplier={supplier} index={index} />
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
          <ThemedText style={styles.title}>Suppliers</ThemedText>
          <Button
            title="New"
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
