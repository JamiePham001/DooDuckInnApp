import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import { router, Stack } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";

import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spacing } from "@/constants/theme";
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


const CreateVendor = () => {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const { jwtToken } = useAuthToken();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (creating) return;
    if (!name.trim() || !email.trim()) {
      Alert.alert(t("common.missingDetails"), t("order.nameAndEmailRequired"));
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`http://${API_HOST}:5010/api/suppliers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const supplier: ISupplier = await res.json();
      // Prefix match — invalidates ["suppliers", jwtToken] without needing the token value here.
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      router.push({
        pathname: "/order/[id]",
        params: { id: supplier.id.toString() },
      });
    } catch (err) {
      console.error("Failed to create vendor:", err);
      Alert.alert(t("common.error"), t("order.createVendorFailed"));
    } finally {
      setCreating(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: t("order.newSupplierTitle") }} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={t("order.nameLabel")}
          placeholder={t("order.namePlaceholder")}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <Input
          label={t("order.emailLabel")}
          placeholder={t("order.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label={t("order.phoneLabel")}
          placeholder={t("order.phonePlaceholder")}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <Button
          title={creating ? t("common.creating") : t("order.createVendor")}
          onPress={handleCreate}
          loading={creating}
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

export default CreateVendor;
