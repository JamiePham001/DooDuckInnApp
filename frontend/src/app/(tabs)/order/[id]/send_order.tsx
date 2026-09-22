import React, { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
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
  const [jwtToken, setJwtToken] = useState("");

  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

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

  // Defaults to the vendor's own email, but stays editable in case the order
  // needs to go somewhere else (a different contact, a shared inbox, etc.).
  useEffect(() => {
    if (data) setEmail(data.email);
  }, [data]);

  async function handleSend() {
    if (sending) return;
    if (!EMAIL_PATTERN.test(email.trim())) {
      Alert.alert("Invalid email", "Enter a valid email address.");
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
      Alert.alert("Error", "Could not send the order email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ThemedView
      style={{
        width: "100%",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        gap: 10,
      }}
    >
      <ThemedText>Send this order to:</ThemedText>
      <TextInput
        style={styles.input}
        placeholder="Recipient email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Pressable
        style={[styles.button, sending && { opacity: 0.5 }]}
        onPress={handleSend}
        disabled={sending}
      >
        <ThemedText>{sending ? "Sending..." : "Send"}</ThemedText>
      </Pressable>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    width: "100%",
    fontSize: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default SendOrder;
