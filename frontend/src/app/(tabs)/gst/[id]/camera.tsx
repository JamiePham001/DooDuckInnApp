import React, { useState, useRef } from "react";
import { StyleSheet, Pressable, View, Platform, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Spacing, Typography } from "@/constants/theme";
import { useI18n } from "@/hooks/use-i18n";
import { useAuthToken } from "@/hooks/use-auth-token";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { File } from "expo-file-system";
import { setPendingScannedTransactionId } from "@/utils/scan-signal";
import { API_HOST } from "@/constants/api";

const InvoiceScan = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const { jwtToken } = useAuthToken();
  const [scanning, setScanning] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const [processing, setProcessing] = useState(false);

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
    // RN's fetch/FormData no longer accepts the old { uri, name, type } file-part shape —
    // it now requires an actual Blob, which expo-file-system's File class implements.
    const formData = new FormData();
    formData.append("image", new File(uri));
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
        // 400/422 are the controller's own handled responses (bad image type, unreadable
        // receipt, GLM failure) — not exceptions, so they never show up as a backend error
        // log. The body text is the only place that reason actually lives.
        const body = await res.text();
        throw new Error(`Call failed to scan (${res.status}): ${body}`);
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
    if (photo?.uri) {
      setProcessing(true);
      setUri(photo.uri);
    }
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
            onPress={() => {
              setUri(null);
              setProcessing(false);
            }}
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
        <View style={styles.cameraBox}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing={"back"}
            ref={ref}
            mode={"picture"}
            autofocus="on"
            animateShutter
            zoom={0}
            // expo-camera crops the live feed to fill styles.cameraBox's bounds by default, and
            // those bounds don't match a captured photo's actual aspect ratio — so
            // takePictureAsync() returns more of the scene than what was framed live. Giving
            // styles.cameraBox the same 4:3 aspectRatio as the capture removes that mismatch on
            // both platforms, since a box already shaped like the photo needs no cropping to fill
            // it. "ratio" is Android-only and just makes Android pick an actual 4:3 sensor mode to
            // match, rather than stretching whatever its default capture size is into that box.
            ratio="4:3"
          />
          <View style={styles.buttonContainer}>
            <Pressable onPress={takePicture} disabled={processing}>
              {({ pressed }) => (
                <View
                  style={[styles.shutterBtn, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <View style={styles.shutterBtnInner} />
                </View>
              )}
            </Pressable>
          </View>
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
    alignItems: "center",
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
  // Matches styles.camera's aspect ratio below, so the full (uncropped) captured photo
  // fills this box exactly instead of being letterboxed or cropped to a different shape.
  previewImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: Spacing.three,
  },
  previewActions: {
    flexDirection: "row",
    gap: Spacing.three,
    width: "100%",
    paddingBottom: Spacing.four,
  },
  previewAction: { flex: 1 },
  // 3:4 (portrait) matches the ratio="4:3" capture requested on CameraView below — this is
  // the width/height ratio that makes the live preview and the captured photo the same shape.
  // The shutter button overlays this box directly (not the full screen), so it stays anchored
  // to the live feed's own edge rather than floating over the letterboxed area beneath it.
  cameraBox: {
    width: "100%",
    aspectRatio: 3 / 4,
  },
  // Camera chrome stays white-on-feed regardless of theme — it sits over the live
  // preview, not over the app's background.
  buttonContainer: {
    position: "absolute",
    bottom: 24,
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
