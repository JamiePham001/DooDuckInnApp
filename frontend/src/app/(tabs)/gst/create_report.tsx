import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import {
  Hairline,
  Radius,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Dropdown } from "react-native-element-dropdown";
import { Alert, Platform, ScrollView, StyleSheet } from "react-native";
import React from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useQueryClient } from "@tanstack/react-query";

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

const CreateReport = () => {
  const queryClient = useQueryClient();
  const colors = useTheme();
  const { t } = useI18n();
  const [jwtToken, setJwtToken] = useState("");

  const months = [
    { label: t("gst.quarters.q1"), start: "01", end: "03" },
    { label: t("gst.quarters.q2"), start: "04", end: "06" },
    { label: t("gst.quarters.q3"), start: "07", end: "09" },
    { label: t("gst.quarters.q4"), start: "10", end: "12" },
  ];

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
        Alert.alert(t("common.error"), t("common.authError"));
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
      // Prefix match — invalidates ["gst", jwtToken] without needing the token value here.
      queryClient.invalidateQueries({ queryKey: ["taxes"] });
      router.push({ pathname: "/gst/[id]", params: { id: tax.id.toString() } });
    } catch (err) {
      console.error("Failed to create tax report:", err);
      Alert.alert(t("common.error"), t("gst.createReportFailed"));
    } finally {
      setCreating(false);
    }
  }
  const dropdownStyle = (focused: boolean) => [
    styles.dropdown,
    {
      backgroundColor: colors.surface,
      borderColor: focused ? colors.accent : colors.border,
    },
  ];

  const canCreate = !!year && !!startMonth;

  return (
    <ThemedView style={styles.screen}>
      <Stack.Screen options={{ title: t("gst.newReportTitle") }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText themeColor="textSecondary" style={styles.intro}>
          {t("gst.reportIntro")}
        </ThemedText>

        <ThemedText themeColor="textSecondary" style={styles.label}>
          {t("gst.yearLabel")}
        </ThemedText>
        <Dropdown
          style={dropdownStyle(isFocus)}
          containerStyle={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: Radius.md,
          }}
          placeholderStyle={{ ...Typography.body, color: colors.textSecondary }}
          selectedTextStyle={{ ...Typography.body, color: colors.text }}
          itemTextStyle={{ ...Typography.body, color: colors.text }}
          activeColor={colors.accentSoft}
          data={years}
          labelField="label"
          valueField="label"
          maxHeight={300}
          value={year}
          placeholder={!isFocus ? t("gst.yearPlaceholder") : "..."}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={(item) => {
            setYear(item.label);
            setIsFocus(false);
          }}
        />

        <ThemedText themeColor="textSecondary" style={styles.label}>
          {t("gst.quarterLabel")}
        </ThemedText>
        <Dropdown
          style={dropdownStyle(isFocus2)}
          containerStyle={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: Radius.md,
          }}
          placeholderStyle={{ ...Typography.body, color: colors.textSecondary }}
          selectedTextStyle={{ ...Typography.body, color: colors.text }}
          itemTextStyle={{ ...Typography.body, color: colors.text }}
          activeColor={colors.accentSoft}
          data={months}
          labelField="label"
          valueField="start"
          maxHeight={300}
          value={startMonth}
          placeholder={!isFocus2 ? t("gst.quarterPlaceholder") : "..."}
          onFocus={() => setIsFocus2(true)}
          onBlur={() => setIsFocus2(false)}
          onChange={(item) => {
            setStartMonth(item.start);
            setEndMonth(item.end);
            setIsFocus2(false);
          }}
        />

        <Button
          title={creating ? t("common.creating") : t("gst.createReport")}
          onPress={handleCreate}
          loading={creating}
          disabled={!canCreate}
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
    gap: Spacing.one,
  },
  intro: { ...Typography.secondary, paddingBottom: Spacing.three },
  label: { ...Typography.caption, paddingTop: Spacing.two },
  dropdown: {
    minHeight: 52,
    borderWidth: Hairline,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    width: "100%",
  },
  submit: { marginTop: Spacing.four },
});

export default CreateReport;
