import React, { useState, type ComponentProps } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

import {
  BottomTabInset,
  Hairline,
  Motion,
  Spacing,
  Typography,
  Radius,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useI18n } from "@/hooks/use-i18n";
import { LOCALES, type Locale } from "@/i18n";
import { ThemedText } from "./themed-text";
import { Dropdown } from "react-native-element-dropdown";
import { Button } from "./ui/button";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function SettingsRow({
  icon,
  filledIcon,
  label,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  filledIcon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  const colors = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.row}>
      {({ pressed }) => (
        <>
          <Ionicons
            name={pressed ? filledIcon : icon}
            size={20}
            color={pressed ? colors.tabActive : colors.tabInactive}
          />
          <Text
            style={[
              styles.text,
              { color: pressed ? colors.tabActive : colors.tabInactive },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SettingsAccordion({ visible, onClose }: Props) {
  const colors = useTheme();
  const { t, locale, setLocale } = useI18n();
  const [modalVisible, setModalVisible] = useState(false);
  const [isFocus, setIsFocus] = useState(false);

  const style = useAnimatedStyle(() => ({
    // Content is a couple of fixed-height rows — a real max-content height, not "100%"
    // (which measures against the whole screen and overshoots). overflow:hidden on the
    // container clips them as this shrinks, instead of letting them poke out the
    // bottom and visually "bunch" into the tab bar mid-collapse.
    maxHeight: withTiming(visible ? 200 : 0, { duration: Motion.base }),
  }));

  const { signOut } = useAuthenticator();

  const dropdownStyle = (focused: boolean) => [
    styles.dropdown,
    {
      backgroundColor: colors.surface,
      borderColor: focused ? colors.accent : colors.border,
    },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        style,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <SettingsRow
        icon="language-outline"
        filledIcon="language"
        label={t("settings.language")}
        onPress={() => {
          onClose();
          setModalVisible(true);
        }}
      />
      <SettingsRow
        icon="log-out-outline"
        filledIcon="log-out"
        label={t("settings.logOut")}
        onPress={signOut}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <TouchableWithoutFeedback
          onPressOut={() => setModalVisible(!modalVisible)}
        >
          <View style={styles.centeredView}>
            <TouchableWithoutFeedback>
              <View style={styles.modalView}>
                <ThemedText style={[styles.modalHeading]}>Languages</ThemedText>

                <Dropdown
                  style={dropdownStyle(isFocus)}
                  containerStyle={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: Radius.md,
                  }}
                  placeholderStyle={{
                    ...Typography.body,
                    color: colors.textSecondary,
                  }}
                  selectedTextStyle={{ ...Typography.body, color: colors.text }}
                  itemTextStyle={{ ...Typography.body, color: colors.text }}
                  activeColor={colors.accentSoft}
                  data={(Object.entries(LOCALES) as [Locale, string][]).map(
                    ([code, name]) => ({ label: name, value: code }),
                  )}
                  labelField="label"
                  valueField="value"
                  maxHeight={300}
                  value={locale}
                  placeholder={!isFocus ? t("settings.chooseLanguage") : "..."}
                  onFocus={() => setIsFocus(true)}
                  onBlur={() => setIsFocus(false)}
                  onChange={(item) => {
                    setLocale(item.value);
                    setIsFocus(false);
                  }}
                />
                <Button
                  title="Ok"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: BottomTabInset,
    borderTopWidth: Hairline,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  text: Typography.body,
  dropdown: {
    width: "100%",
    minHeight: 52,
    marginBottom: Spacing.three,
    borderWidth: Hairline,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },

  // modal
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "stretch",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: { alignSelf: "stretch" },
  modalHeading: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    overflowY: "auto",
    paddingBottom: 30,
  },
});
