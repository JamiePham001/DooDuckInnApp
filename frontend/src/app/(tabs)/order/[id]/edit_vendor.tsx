import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spacing } from "@/constants/theme";

interface ISupplier {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
}

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

const EditVendor = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);
  const queryClient = useQueryClient();
  const [jwtToken, setJwtToken] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

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

  const { data } = useQuery<ISupplier>({
    queryKey: ["supplier", supplierId, jwtToken],
    queryFn: () => fetchSupplier(supplierId, jwtToken),
    enabled: !!jwtToken && !!supplierId,
  });

  // Prefill once the supplier loads — fields stay editable afterwards.
  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setEmail(data.email);
    setPhone(data.phone);
  }, [data]);

  async function handleSave() {
    if (saving) return;
    if (!name.trim()) {
      Alert.alert("Missing details", "Name is required.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `http://${API_HOST}:5010/api/suppliers/${supplierId}/update/details`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
          }),
        },
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      router.back();
    } catch (err) {
      console.error("Failed to update vendor:", err);
      Alert.alert("Error", "Could not save vendor details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label="Name"
          placeholder="Bidfood"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Input
          label="Email"
          placeholder="orders@supplier.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Phone (optional)"
          placeholder="08 9000 0000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Button
          title={saving ? "Saving..." : "Save changes"}
          onPress={handleSave}
          loading={saving}
          style={styles.submit}
        />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  submit: { marginTop: Spacing.two },
});

export default EditVendor;
