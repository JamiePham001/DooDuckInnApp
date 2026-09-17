import * as Device from "expo-device";
import {
  Platform,
  StyleSheet,
  Button,
  View,
  Text,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { ExternalLink } from "@/components/external-link";

export default function GstPage() {
  return (
    <ScrollView>
      <ThemedView
        style={{
          flex: 1,
          paddingHorizontal: 20,
          width: "100%",
        }}
      >
        <ThemedView
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <ThemedText>History</ThemedText>
          <ThemedText>New</ThemedText>
        </ThemedView>
        <ThemedView
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ThemedView
            style={{
              width: "100%",
              backgroundColor: "#ffffff",
              height: 50,
              borderRadius: 10,
              flex: 1,
            }}
          >
            <ThemedText>Sold</ThemedText>
            <ThemedView>Sold</ThemedView>
            <ThemedView>Sold</ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  //   container: {
  //     flex: 1,
  //     justifyContent: "center",
  //     flexDirection: "row",
  //   },
  //   safeArea: {
  //     flex: 1,
  //     paddingHorizontal: Spacing.four,
  //     alignItems: "center",
  //     gap: Spacing.three,
  //     paddingBottom: BottomTabInset + Spacing.three,
  //     maxWidth: MaxContentWidth,
  //   },
  //   heroSection: {
  //     alignItems: "center",
  //     justifyContent: "center",
  //     flex: 1,
  //     paddingHorizontal: Spacing.four,
  //     gap: Spacing.four,
  //   },
  //   title: {
  //     textAlign: "center",
  //   },
  //   code: {
  //     textTransform: "uppercase",
  //   },
  //   stepContainer: {
  //     gap: Spacing.three,
  //     alignSelf: "stretch",
  //     paddingHorizontal: Spacing.three,
  //     paddingVertical: Spacing.four,
  //     borderRadius: Spacing.four,
  //   },
});
