import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Pressable, View, Platform, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Spacing, Typography } from "@/constants/theme";
import { useI18n } from "@/hooks/use-i18n";
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
  const { t } = useI18n();

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
        Alert.alert(t("common.error"), t("common.authError"));
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
      <ThemedView style={styles.permission}>
        <ThemedText style={styles.permissionTitle}>
          {t("gst.cameraPermissionTitle")}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.message}>
          {t("gst.cameraPermissionBody")}
        </ThemedText>
        <Button title={t("gst.grantPermission")} onPress={requestPermission} />
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
      Alert.alert(t("gst.scanFailedTitle"), t("gst.scanFailedBody"));
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
      <ThemedView style={styles.preview}>
        <Stack.Screen options={{ title: t("gst.checkPhotoTitle") }} />
        <Image
          source={{ uri }}
          contentFit="contain"
          style={styles.previewImage}
        />
        <ThemedText themeColor="textSecondary" style={styles.message}>
          {t("gst.scanHint")}
        </ThemedText>
        <View style={styles.previewActions}>
          <Button
            title={t("gst.retake")}
            icon="refresh-outline"
            variant="secondary"
            onPress={() => setUri(null)}
            disabled={scanning}
            style={styles.previewAction}
          />
          <Button
            title={scanning ? t("gst.scanning") : t("gst.scanButton")}
            icon="scan-outline"
            onPress={() => scanImage(uri)}
            loading={scanning}
            style={styles.previewAction}
          />
        </View>
      </ThemedView>
    );
  };

  const renderCamera = () => {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: t("gst.scanTitle"),
          }}
        />
        <CameraView
          style={styles.camera}
          facing={"back"}
          ref={ref}
          mode={"picture"}
        />
        <View style={styles.buttonContainer}>
          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <View style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}>
                <View style={styles.shutterBtnInner} />
              </View>
            )}
          </Pressable>
        </View>
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
  },
  permission: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  permissionTitle: { ...Typography.title, textAlign: "center" },
  message: { ...Typography.secondary, textAlign: "center" },
  preview: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  previewImage: { width: "100%", flex: 1, borderRadius: Spacing.three },
  previewActions: {
    flexDirection: "row",
    gap: Spacing.three,
    width: "100%",
    paddingBottom: Spacing.four,
  },
  previewAction: { flex: 1 },
  camera: {
    flex: 1,
  },
  // Camera chrome stays white-on-feed regardless of theme — it sits over the live
  // preview, not over the app's background.
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
    backgroundColor: "white",
  },
});

export default InvoiceScan;
