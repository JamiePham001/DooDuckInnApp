import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { Alert, Platform, Pressable, StyleSheet } from "react-native";
import React from "react";
import { fetchAuthSession } from "aws-amplify/auth";

interface ITaxReport {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  isSent: boolean;
}

const years = [
  { label: "2025", value: 2025 },
  { label: "2026", value: 2026 },
  { label: "2027", value: 2027 },
  { label: "2028", value: 2028 },
  { label: "2029", value: 2029 },
  { label: "2030", value: 2030 },
  { label: "2031", value: 2031 },
  { label: "2032", value: 2032 },
  { label: "2033", value: 2033 },
  { label: "2034", value: 2034 },
  { label: "2035", value: 2035 },
];

const months = [
  { label: "January - March", start: "01", end: "03" },
  { label: "April - June", start: "04", end: "06" },
  { label: "July - September", start: "07", end: "09" },
  { label: "October - December", start: "10", end: "12" },
];

const CreateReport = () => {
  const [jwtToken, setJwtToken] = useState("");

  const [year, setYear] = useState(null);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");

  const [isFocus, setIsFocus] = useState(false);
  const [isFocus2, setIsFocus2] = useState(false);
  const [creating, setCreating] = useState(false);

  const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

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
    setCreating(true);
    try {
      const start = new Date(`${year}-${startMonth}-01`);
      const end = new Date(`${year}-${endMonth}-01`);
      const toDateOnly = (d: Date) => d.toISOString().slice(0, 10);

      const res = await fetch(`http://${API_HOST}:5010/api/taxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          dateStart: toDateOnly(start),
          dateEnd: toDateOnly(end),
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const tax: ITaxReport = await res.json();
      router.push({ pathname: "/gst/[id]", params: { id: tax.id.toString() } });
    } catch (err) {
      console.error("Failed to create tax report:", err);
      Alert.alert("Error", "Could not create a new GST report.");
    } finally {
      setCreating(false);
    }
  }
  return (
    <ThemedView
      style={{
        width: "100%",
        flex: 1,
      }}
    >
      <Stack.Screen
        options={{
          title: "Create Report",
        }}
      />
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
        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: "blue" }]}
          data={years}
          labelField="label"
          valueField="label"
          maxHeight={300}
          placeholder={!isFocus ? "Year" : "..."}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={(item) => {
            setYear(item.label);
            setIsFocus(false);
          }}
        />
        <Dropdown
          style={[styles.dropdown, isFocus2 && { borderColor: "blue" }]}
          data={months}
          labelField="label"
          valueField="start"
          maxHeight={300}
          placeholder={!isFocus2 ? "Quarter" : "..."}
          onFocus={() => setIsFocus2(true)}
          onBlur={() => setIsFocus2(false)}
          onChange={(item) => {
            setStartMonth(item.start);
            setEndMonth(item.end);
            setIsFocus2(false);
          }}
        />
        <ThemedView
          style={{
            flexDirection: "row",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Pressable style={styles.button} onPress={() => handleCreate()}>
            <ThemedText>Create</ThemedText>
          </Pressable>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    padding: 16,
  },
  dropdown: {
    height: 50,
    borderColor: "gray",
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    width: "100%",
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: "absolute",
    backgroundColor: "white",
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    color: "white",
  },
});

export default CreateReport;
