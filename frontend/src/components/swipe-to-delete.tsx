import React, { useRef, type ReactNode } from "react";
import { Alert, Animated, PanResponder, StyleSheet } from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";

type Props = {
  children: ReactNode;
  onDelete: () => void;
  confirmMessage?: string;
  borderRadius: number;
};

const DELETE_WIDTH = 80;
const OPEN_THRESHOLD = DELETE_WIDTH / 2;

export function SwipeToDelete({
  children,
  onDelete,
  confirmMessage,
  borderRadius,
}: Props) {
  const colors = useTheme();
  const { t } = useI18n();
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  // Ties the action panel's visibility to how far it's actually been swiped open,
  // rather than leaving it permanently opaque behind the row. At rest (translateX 0)
  // it's fully transparent, which is what stops it from ever being able to flash
  // through — previously it relied entirely on the row content painting on top of it
  // fast enough, which isn't guaranteed on the very first render.
  const actionOpacity = translateX.interpolate({
    inputRange: [-DELETE_WIDTH, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  function resetPosition() {
    isOpen.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
  }

  function confirmDelete() {
    Alert.alert(
      t("common.confirmDeleteTitle"),
      confirmMessage ?? t("common.confirmDeleteBody"),
      [
        { text: t("common.cancel"), style: "cancel", onPress: resetPosition },
        { text: t("common.delete"), style: "destructive", onPress: onDelete },
      ],
    );
  }

  const panResponder = useRef(
    PanResponder.create({
      // Capture phase runs BEFORE touches reach children — this is what lets a
      // swipe claim the gesture even when it starts over a TextInput, unlike
      // react-native-gesture-handler's Swipeable, which negotiates alongside
      // TextInput's own native touch handling rather than ahead of it, and so
      // could be starved of the gesture entirely by the input.
      onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5;
      },
      onPanResponderMove: (_evt, gestureState) => {
        const base = isOpen.current ? -DELETE_WIDTH : 0;
        const next = base + gestureState.dx;
        translateX.setValue(Math.min(0, Math.max(-DELETE_WIDTH, next)));
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const passedThreshold = isOpen.current
          ? gestureState.dx > -OPEN_THRESHOLD
          : gestureState.dx < -OPEN_THRESHOLD;

        if (passedThreshold && !isOpen.current) {
          isOpen.current = true;
          Animated.spring(translateX, {
            toValue: -DELETE_WIDTH,
            useNativeDriver: true,
          }).start(() => confirmDelete());
        } else {
          resetPosition();
        }
      },
    }),
  ).current;

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.action,
          {
            borderRadius: borderRadius,
            backgroundColor: colors.critical,
            opacity: actionOpacity,
          },
        ]}
      >
        <ThemedText style={styles.actionText}>{t("common.delete")}</ThemedText>
      </Animated.View>
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  action: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.four,
    transform: [{ scale: 0.99 }],
  },
  actionText: {
    ...Typography.caption,
    color: "#FFFFFF",
  },
});
