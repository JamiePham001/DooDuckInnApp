import React from "react";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";

interface ISupplier {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
}

const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const fetchSuppliers = async (jwtToken: string): Promise<ISupplier[]> => {
  const res = await fetch(`http://${API_HOST}:5010/api/users/me/suppliers`, {
    method: "GET",
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return await res.json();
};

const deleteSupplier = (id: number) => {};

export default function orderPage() {
  const [jwtToken, setJwtToken] = useState("");
  const router = useRouter();

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

  const { data, isLoading, error } = useQuery<ISupplier[]>({
    // Was "taxes" — the exact same key (and same jwtToken) as the GST report
    // list's query, so both would have collided in the shared QueryClient's
    // cache and overwritten each other's data.
    queryKey: ["suppliers", jwtToken],
    queryFn: () => fetchSuppliers(jwtToken),
    enabled: !!jwtToken,
    staleTime: 1000 * 60 * 5, // 5 minutes cache before refetch
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (renamed from cacheTime in v5)
  });

  const SupplierList = ({ data }: { data: ISupplier[] | undefined }) => {
    const scheme = useColorScheme();
    const colors = Colors[scheme === "unspecified" ? "light" : scheme];
    const router = useRouter();

    return (
      <ThemedView style={styles.contentContainer}>
        {isLoading && (
          <ThemedView style={styles.dataMessage}>
            <ActivityIndicator />
          </ThemedView>
        )}
        {error && (
          <ThemedView style={styles.dataMessage}>
            <ThemedText>Error loading data</ThemedText>
          </ThemedView>
        )}
        {data?.length == 0 ? (
          <ThemedView style={styles.dataMessage}>
            <ThemedText>Data is empty</ThemedText>
          </ThemedView>
        ) : (
          <ThemedView style={{ alignSelf: "flex-start", width: "100%" }}>
            {data?.map((supplier) => (
              <SwipeToDelete
                key={supplier.id}
                confirmMessage={`Delete the supplier ${supplier.name}? This can't be undone.`}
                onDelete={() => deleteSupplier(supplier.id)}
                borderRadius={20}
              >
                <Pressable
                  style={styles.row}
                  onPress={() =>
                    router.push({
                      pathname: "/order/[id]",
                      params: { id: supplier.id.toString() },
                    })
                  }
                >
                  <ThemedText>{supplier.name}</ThemedText>
                </Pressable>
              </SwipeToDelete>
            ))}
          </ThemedView>
        )}
      </ThemedView>
    );
  };

  return (
    <ScrollView
      style={styles.pageContainer}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Pressable
        style={[styles.button, { alignSelf: "flex-end" }]}
        onPress={() =>
          router.push({
            pathname: "/order/create_vendor",
          })
        }
      >
        <ThemedText>New</ThemedText>
      </Pressable>
      <SupplierList data={data} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  dataMessage: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    paddingBottom: 80,
  },
  button: {
    backgroundColor: "#1877F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    color: "white",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
