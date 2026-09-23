import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spacing, Typography } from "@/constants/theme";
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

const SendOrder = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const supplierId = Number(id);
  const { jwtToken } = useAuthToken();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const { data } = useQuery<ISupplier>({
    queryKey: ["supplier", supplierId, jwtToken],
    queryFn: () => fetchSupplier(supplierId, jwtToken),
    enabled: !!jwtToken && !!supplierId,
  });

  // Defaults to the vendor's own email, but stays editable in case the order
  // needs to go somewhere else (a different contact, a shared inbox, etc.).
  useEffect(() => {
    if (data) setEmail(data.email);
  }, [data]);

  async function handleSend() {
    if (sending) return;
    if (!EMAIL_PATTERN.test(email.trim())) {
      Alert.alert(t("common.invalidEmail"), t("common.enterValidEmail"));
      return;
    }

    setSending(true);
    try {
      const res = await fetch(
        `http://${API_HOST}:5010/api/suppliers/${supplierId}/send-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            RecipientEmail: email.trim(),
            date: new Date().toISOString().slice(0, 10),
          }),
        },
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      router.back();
    } catch (err) {
      console.error("Failed to send order:", err);
      Alert.alert(t("common.error"), t("order.sendOrderFailed"));
    } finally {
      setSending(false);
    }
  }

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText themeColor="textSecondary" style={styles.intro}>
          {t("order.sendOrderIntro")}
        </ThemedText>
        <Input
          label={t("order.sendToLabel")}
          placeholder={t("order.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button
          title={sending ? t("common.sending") : t("order.sendOrderButton")}
          icon="paper-plane-outline"
          onPress={handleSend}
          loading={sending}
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
  intro: Typography.secondary,
  submit: { marginTop: Spacing.two },
});

export default SendOrder;
