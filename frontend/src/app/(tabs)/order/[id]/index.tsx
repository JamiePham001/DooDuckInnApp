import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PressableScale } from "@/components/ui/pressable-scale";
import {
  Hairline,
  Radius,
  Shadow,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

interface ISupplier {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
}

interface IItem {
  id: number;
  supplierId: number;
  name: string;
  quantity: number;
}

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const fetchSupplier = async (
  supplierId: number,
  jwtToken: string,
): Promise<ISupplier> => {
  const res = await fetch(
    `http://${API_HOST}:5010/api/suppliers/${supplierId}`,
    {
      headers: { Authorization: `Bearer ${jwtToken}` },
    },
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
};

const fetchItems = async (
  supplierId: number,
  jwtToken: string,
): Promise<IItem[]> => {
  const res = await fetch(
    `http://${API_HOST}:5010/api/suppliers/${supplierId}/items`,
    { headers: { Authorization: `Bearer ${jwtToken}` } },
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
};

function DebouncedItemNameInput({
  initialName,
  onSave,
}: {
  initialName: string;
  onSave: (name: string) => Promise<Response>;
}) {
  const colors = useTheme();
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(text: string) {
    const previousValue = name;
    setName(text);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await onSave(text);
        if (!res.ok) throw new Error("Failed to update item name");
      } catch {
        setName(previousValue);
      }
    }, 600);
  }

  return (
    <TextInput
      value={name}
      onChangeText={handleChange}
      placeholder={t("order.itemNamePlaceholder")}
      placeholderTextColor={colors.textSecondary}
      style={{
        flex: 2,
        textAlign: "left",
        color: colors.text,
        ...Typography.secondary,
      }}
    />
  );
}

function DebouncedItemQtyInput({
  initialQty,
  onSave,
}: {
  initialQty: number;
  onSave: (qty: number) => Promise<Response>;
}) {
  const colors = useTheme();
  // Kept as a raw string, not a number — coercing on every keystroke drops
  // characters a user is still mid-typing (e.g. a leading "0").
  const [text, setText] = useState(initialQty.toString());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    const previousValue = text;
    setText(value);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const parsed = parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 0)
          throw new Error("Quantity failed to parse");
        const res = await onSave(parsed);
        if (!res.ok) throw new Error("Failed to update item quantity");
      } catch {
        setText(previousValue);
      }
    }, 600);
  }

  return (
    <TextInput
      value={text}
      onChangeText={handleChange}
      keyboardType="number-pad"
      placeholderTextColor={colors.textSecondary}
      style={{
        flex: 1,
        textAlign: "left",
        color: colors.text,
        ...Typography.secondary,
      }}
    />
  );
}

export default function VendorDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);
  const router = useRouter();
  const colors = useTheme();
  const { t } = useI18n();
  const [jwtToken, setJwtToken] = useState("");
  const [itemsArray, setItemsArray] = useState<IItem[]>([]);
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
        Alert.alert(t("common.error"), t("common.authError"));
      }
    };
    getToken();
  }, []);

  const {
    data: supplier,
    isLoading: supplierLoading,
    error: supplierError,
  } = useQuery<ISupplier>({
    queryKey: ["supplier", supplierId, jwtToken],
    queryFn: () => fetchSupplier(supplierId, jwtToken),
    enabled: !!jwtToken && !!supplierId,
  });

  const {
    data: items,
    isLoading: itemsLoading,
    error: itemsError,
  } = useQuery<IItem[]>({
    queryKey: ["supplier-items", supplierId, jwtToken],
    queryFn: () => fetchItems(supplierId, jwtToken),
    enabled: !!jwtToken && !!supplierId,
  });

  useEffect(() => {
    if (items) setItemsArray(items);
  }, [items]);

  const addItem = async () => {
    try {
      setCreating(true);
      const res = await fetch(
        `http://${API_HOST}:5010/api/suppliers/${supplierId}/item`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({ name: "" }),
        },
      );
      if (!res.ok) throw new Error(`Failed to create item: ${res.status}`);
      const item = await res.json();
      setItemsArray((current) => [...current, item]);
    } catch (err) {
      console.error("Failed to add item:", err);
    } finally {
      setCreating(false);
    }
  };

  const deleteItem = async (itemId: number) => {
    try {
      const res = await fetch(`http://${API_HOST}:5010/api/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      if (!res.ok) throw new Error(`Failed to delete item: ${res.status}`);
      setItemsArray((current) => current.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const callVendor = () => {
    if (!supplier?.phone) return;
    Linking.openURL(`tel:${supplier.phone}`);
  };

  if (supplierLoading || itemsLoading)
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );

  if (supplierError || itemsError || !supplier)
    return (
      <ThemedView style={styles.centered}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={colors.critical}
        />
        <ThemedText style={styles.messageTitle}>
          {t("order.loadDetailError")}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.messageBody}>
          {t("common.checkConnection")}
        </ThemedText>
      </ThemedView>
    );

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: supplier.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.contactCard}>
          <ThemedText style={styles.vendorName}>{supplier.name}</ThemedText>
          {!!supplier.email && (
            <View style={styles.contactRow}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={colors.textSecondary}
              />
              <ThemedText themeColor="textSecondary" style={styles.contactText}>
                {supplier.email}
              </ThemedText>
            </View>
          )}
          {!!supplier.phone && (
            <PressableScale onPress={callVendor} style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color={colors.accent} />
              <ThemedText style={[styles.contactText, { color: colors.accent }]}>
                {supplier.phone}
              </ThemedText>
            </PressableScale>
          )}
        </Card>

        <View style={styles.actionsRow}>
          <Button
            title={t("order.editButton")}
            icon="create-outline"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/order/[id]/edit_vendor",
                params: { id },
              })
            }
            style={styles.action}
          />
          <Button
            title={t("order.sendOrderButton")}
            icon="paper-plane-outline"
            onPress={() =>
              router.push({
                pathname: "/order/[id]/send_order",
                params: { id },
              })
            }
            style={styles.action}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>
            {t("order.itemsTitle")}
          </ThemedText>
          <ThemedView
            style={[
              styles.tableContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <ThemedView
              style={[
                styles.tableRow,
                styles.headerRow,
                { backgroundColor: colors.surface },
              ]}
            >
              <ThemedText themeColor="textSecondary" style={styles.headerCell2}>
                {t("common.nameColumn")}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.headerCell1}>
                {t("order.qtyColumn")}
              </ThemedText>
            </ThemedView>

            {itemsArray.map((item) => (
              <SwipeToDelete
                key={item.id}
                confirmMessage={t("common.deleteNamedConfirm", {
                  name: item.name || t("order.unnamedItem"),
                })}
                onDelete={() => deleteItem(item.id)}
                borderRadius={0}
              >
                <ThemedView
                  style={[
                    styles.tableRow,
                    {
                      backgroundColor: colors.surface,
                      borderTopColor: colors.border,
                    },
                  ]}
                >
                  <DebouncedItemNameInput
                    initialName={item.name}
                    onSave={(name) =>
                      fetch(
                        `http://${API_HOST}:5010/api/items/${item.id}/update/name?name=${encodeURIComponent(name)}`,
                        {
                          method: "PATCH",
                          headers: { Authorization: `Bearer ${jwtToken}` },
                        },
                      )
                    }
                  />
                  <DebouncedItemQtyInput
                    initialQty={item.quantity}
                    onSave={(qty) =>
                      fetch(
                        `http://${API_HOST}:5010/api/items/${item.id}/update/quantity?qty=${qty}`,
                        {
                          method: "PATCH",
                          headers: { Authorization: `Bearer ${jwtToken}` },
                        },
                      )
                    }
                  />
                </ThemedView>
              </SwipeToDelete>
            ))}

            <PressableScale
              style={[
                styles.addRow,
                {
                  backgroundColor: colors.accentSoft,
                  borderTopColor: colors.border,
                },
              ]}
              onPress={addItem}
              disabled={creating}
            >
              <Ionicons name="add" size={18} color={colors.accent} />
              <ThemedText style={[styles.addRowText, { color: colors.accent }]}>
                {t("order.addItem")}
              </ThemedText>
            </PressableScale>
          </ThemedView>
        </View>
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
    gap: Spacing.three,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  messageTitle: { ...Typography.title, textAlign: "center" },
  messageBody: { ...Typography.secondary, textAlign: "center" },
  contactCard: { gap: Spacing.two },
  vendorName: Typography.title,
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    minHeight: 32,
  },
  contactText: Typography.secondary,
  actionsRow: { flexDirection: "row", gap: Spacing.three },
  action: { flex: 1 },
  section: { gap: Spacing.two },
  sectionTitle: Typography.heading,
  tableContainer: {
    width: "100%",
    borderRadius: Radius.lg,
    borderWidth: Hairline,
    overflow: "hidden",
    ...Shadow.card,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: Hairline,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    gap: Spacing.two,
  },
  headerRow: { borderTopWidth: 0 },
  headerCell2: { ...Typography.caption, flex: 2, textAlign: "left" },
  headerCell1: { ...Typography.caption, flex: 1, textAlign: "left" },
  addRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.one,
    minHeight: 44,
    borderTopWidth: Hairline,
  },
  addRowText: Typography.caption,
});
