import React, { useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { ThemedText } from "./themed-text";
import { ThemedView } from "./themed-view";
import { Radius, Shadow, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";

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
  const [confirmVisible, setConfirmVisible] = useState(false);

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

  function cancelDelete() {
    setConfirmVisible(false);
    resetPosition();
  }

  function confirmedDelete() {
    setConfirmVisible(false);
    resetPosition();
    onDelete();
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
          }).start(() => setConfirmVisible(true));
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

      <Modal
        animationType="slide"
        transparent
        visible={confirmVisible}
        onRequestClose={cancelDelete}
      >
        <TouchableWithoutFeedback onPressOut={cancelDelete}>
          <View style={styles.centeredView}>
            {/* Swallows the press so tapping the card itself doesn't bubble up
                to the backdrop's onPressOut and dismiss the modal. */}
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalView,
                  { backgroundColor: colors.surface, borderColor: colors.text },
                ]}
              >
                <ThemedText style={styles.modalHeading}>
                  {t("common.confirmDeleteTitle")}
                </ThemedText>
                <ThemedText style={styles.modalText}>
                  {confirmMessage ?? t("common.confirmDeleteBody")}
                </ThemedText>
                <View style={styles.modalActions}>
                  <Button
                    title={t("common.cancel")}
                    onPress={cancelDelete}
                    style={{ backgroundColor: colors.textSecondary }}
                  />
                  <Button
                    title={t("common.delete")}
                    onPress={confirmedDelete}
                    style={{ backgroundColor: colors.critical }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    margin: Spacing.four,
    borderRadius: Radius.lg,
    padding: Spacing.five,
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderStyle: "solid",
    ...Shadow.raised,
  },
  modalHeading: { ...Typography.title, textAlign: "center" },
  modalText: { ...Typography.secondary, textAlign: "center" },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: Spacing.two,
  },
});
