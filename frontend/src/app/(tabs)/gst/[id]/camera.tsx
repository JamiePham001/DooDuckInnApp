import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Button,
  Platform,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { fetchAuthSession } from "aws-amplify/auth";
import { setPendingScannedTransactionId } from "@/utils/scan-signal";

const InvoiceScan = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [jwtToken, setJwtToken] = useState("");
  const [scanning, setScanning] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const API_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

  useEffect(() => {
    const getToken = async () => {
      try {
        const session = await fetchAuthSession();
        // The backend validates the JWT's `aud` claim against the Cognito app client —
        // Cognito's access token has no `aud` at all (only `client_id`), so it always
        // fails that check. The ID token carries both `aud` and `sub`.
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

  if (!permission) {
    // Camera permissions are still loading.
    return <ThemedView />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>
          We need your permission to show the camera
        </ThemedText>
        <Pressable
          onPress={requestPermission}
          style={{ backgroundColor: "blue" }}
        >
          <ThemedText style={styles.message}>grant permission</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const scanImage = async (uri: string) => {
    setScanning(true);
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "invoice.jpg",
      type: "image/jpeg",
    } as any);
    try {
      const res = await fetch(
        `http://${API_HOST}:5010/api/taxes/${id}/transactions/scan`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
          body: formData,
        },
      );

      if (!res.ok) {
        throw new Error("Call failed to scan.");
      }
      // ScanTransaction already saves the transaction server-side (create, or
      // update a matched existing row) and returns the real persisted record —
      // this id is what the editor uses to highlight the affected row.
      const created = await res.json();
      setPendingScannedTransactionId(created.id);
      router.back();
    } catch (error) {
      console.error("Scan image failed: ", error);
      Alert.alert("Scan failed", "Could not process the receipt. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    if (photo?.uri) setUri(photo.uri);
  };

  const renderPicture = (uri: string) => {
    return (
      <ThemedView
        style={{
          alignItems: "center",
          // justifyContent: "center",
          flex: 1,
          paddingHorizontal: 20,
        }}
      >
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 600, aspectRatio: 1 }}
        />
        <ThemedView
          style={{ alignItems: "center", width: "100%", paddingTop: 10 }}
        >
          <ThemedText>
            Make sure the invoice is in frame and well lit before scanning.
          </ThemedText>
        </ThemedView>
        <ThemedView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: "100%",
            paddingTop: 20,
          }}
        >
          <Button
            onPress={() => setUri(null)}
            title="Take another picture"
            disabled={scanning}
          />
          <Button
            onPress={() => scanImage(uri)}
            title="Scan Image"
            disabled={scanning}
          />
        </ThemedView>
      </ThemedView>
    );
  };

  const renderCamera = () => {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Scan",
          }}
        />
        <CameraView
          style={styles.camera}
          facing={"back"}
          ref={ref}
          mode={"picture"}
        />
        <ThemedView style={styles.buttonContainer}>
          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <ThemedView
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <ThemedView
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: "white",
                    },
                  ]}
                />
              </ThemedView>
            )}
          </Pressable>
        </ThemedView>
      </ThemedView>
    );
  };
  return (
    <ThemedView style={styles.container2}>
      {uri ? renderPicture(uri) : renderCamera()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  container2: {
    flex: 1,
    backgroundColor: "#fff",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    backgroundColor: "transparent",
    width: "100%",
    paddingHorizontal: 64,
    justifyContent: "center",
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },

  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});

export default InvoiceScan;
