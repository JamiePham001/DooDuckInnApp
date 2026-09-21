import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Pressable, TouchableOpacity, Button } from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { Stack } from "expo-router";
import { Image } from "expo-image";

const InvoiceScan = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);

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

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    if (photo?.uri) setUri(photo.uri);
  };

  const renderPicture = (uri: string) => {
    return (
      <ThemedView style={{ alignItems: "center", justifyContent: "center" }}>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button onPress={() => setUri(null)} title="Take another picture" />
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
