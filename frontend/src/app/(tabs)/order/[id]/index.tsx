import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

interface ISupplier {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
}

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const fetchSupplier = async (
  supplierId: number,
  jwtToken: string,
): Promise<ISupplier> => {
  const res = await fetch(`http://${API_HOST}:5010/api/suppliers/${supplierId}`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
};

export default function VendorDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);
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

  const { data, isLoading, error } = useQuery<ISupplier>({
    queryKey: ["supplier", supplierId, jwtToken],
    queryFn: () => fetchSupplier(supplierId, jwtToken),
    enabled: !!jwtToken && !!supplierId,
  });

  if (isLoading)
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </ThemedView>
    );

  if (error || !data)
    return (
      <ThemedView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ThemedText>Error loading vendor</ThemedText>
      </ThemedView>
    );

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Stack.Screen options={{ title: data.name }} />
      <ThemedView style={{ padding: 20, gap: 12 }}>
        <ThemedText type="title">{data.name}</ThemedText>
        <ThemedText>{data.email}</ThemedText>
        {!!data.phone && <ThemedText>{data.phone}</ThemedText>}
      </ThemedView>
    </ScrollView>
  );
}
