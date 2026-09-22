import React, { useEffect, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, TextInput } from "react-native";
import { router, Stack } from "expo-router";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQueryClient } from "@tanstack/react-query";

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

const CreateVendor = () => {
  const queryClient = useQueryClient();
  const [jwtToken, setJwtToken] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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

  async function handleCreate() {
    if (creating) return;
    if (!name.trim() || !email.trim()) {
      Alert.alert("Missing details", "Name and email are required.");
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
      Alert.alert("Error", "Could not create a new vendor.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <ThemedView style={{ width: "100%", flex: 1 }}>
      <Stack.Screen options={{ title: "New Vendor" }} />
      <ThemedView
        style={{
          width: "100%",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 80,
          paddingHorizontal: 20,
          gap: 10,
        }}
      >
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone (optional)"
          placeholderTextColor="#888"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <ThemedView
          style={{
            flexDirection: "row",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Pressable
            style={[styles.button, creating && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={creating}
          >
            <ThemedText>{creating ? "Creating..." : "Create"}</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
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
    color: "white",
  },
});

export default CreateVendor;
