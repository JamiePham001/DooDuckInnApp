import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SwipeToDelete } from "@/components/swipe-to-delete";

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
      style={{ flex: 2, textAlign: "left", fontSize: 12 }}
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
      style={{ flex: 1, textAlign: "left", fontSize: 12 }}
    />
  );
}

export default function VendorDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);
  const router = useRouter();
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
        Alert.alert("Error", "Could not retrieve authentication token.");
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
        <ThemedText>Error loading vendor</ThemedText>
      </ThemedView>
    );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Stack.Screen options={{ title: supplier.name }} />
      <ThemedView style={styles.header}>
        {!!supplier.phone && (
          <Pressable onPress={callVendor}>
            <ThemedText style={styles.phoneLink}>{supplier.phone}</ThemedText>
          </Pressable>
        )}
      </ThemedView>

      <ThemedView style={styles.actionsRow}>
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/order/[id]/edit_vendor",
              params: { id },
            })
          }
        >
          <ThemedText>Edit Details</ThemedText>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/order/[id]/send_order",
              params: { id },
            })
          }
        >
          <ThemedText>Send Order</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView style={styles.pageContainer}>
        <ThemedView style={styles.tableContainer}>
          <ThemedView style={styles.tableRow}>
            <ThemedText style={{ flex: 2, textAlign: "left" }}>Name</ThemedText>
            <ThemedText style={{ flex: 1, textAlign: "left" }}>Qty</ThemedText>
          </ThemedView>
          {itemsArray.map((item) => (
            <SwipeToDelete
              key={item.id}
              confirmMessage={`Delete "${item.name || "this item"}"? This can't be undone.`}
              onDelete={() => deleteItem(item.id)}
              borderRadius={0}
            >
              <ThemedView style={styles.tableRow}>
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
          <TouchableOpacity
            style={styles.addBtn}
            onPress={addItem}
            disabled={creating}
          >
            <ThemedText>+</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, gap: 6 },
  phoneLink: { color: "#1877F2", textDecorationLine: "underline" },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  button: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pageContainer: { paddingHorizontal: 20, width: "100%" },
  tableContainer: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
  },
  tableRow: {
    backgroundColor: "white",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
    height: 45,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  addBtn: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    height: 30,
    backgroundColor: "#1877F2",
  },
});
