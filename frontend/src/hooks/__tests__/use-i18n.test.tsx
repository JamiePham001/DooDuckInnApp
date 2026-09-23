import React from "react";
import { Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { I18nProvider, useI18n } from "../use-i18n";

// I18nProvider's initI18n() falls back to the device language when nothing is
// saved — stubbed to a fixed value so tests aren't at the mercy of the test
// runner's locale.
jest.mock("react-native-localize", () => ({
  findBestLanguageTag: jest.fn(() => ({ languageTag: "en", isRTL: false })),
}));

function Consumer() {
  const { t, locale, setLocale } = useI18n();
  return (
    <>
      <Text>{t("common.cancel")}</Text>
      <Text testID="locale">{locale}</Text>
      <Pressable onPress={() => setLocale("vi")} testID="switch-to-vi">
        <Text>switch</Text>
      </Pressable>
    </>
  );
}

describe("I18nProvider", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("renders translated text in the resolved starting locale", async () => {
    await render(
      <I18nProvider>
        <Consumer />
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("locale").props.children).toBe("en"));
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("re-renders every consumer with the new language when the user switches it", async () => {
    await render(
      <I18nProvider>
        <Consumer />
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("locale").props.children).toBe("en"));

    await fireEvent.press(screen.getByTestId("switch-to-vi"));

    await waitFor(() => expect(screen.getByTestId("locale").props.children).toBe("vi"));
    expect(screen.getByText("Hủy")).toBeTruthy();
  });

  it("persists the chosen language so it survives a restart", async () => {
    await render(
      <I18nProvider>
        <Consumer />
      </I18nProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("locale").props.children).toBe("en"));

    await fireEvent.press(screen.getByTestId("switch-to-vi"));

    await waitFor(async () => {
      expect(await AsyncStorage.getItem("user-lang")).toBe("vi");
    });
  });

  it("restores a previously saved language on next mount, ignoring the device default", async () => {
    await AsyncStorage.setItem("user-lang", "vi");

    await render(
      <I18nProvider>
        <Consumer />
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("locale").props.children).toBe("vi"));
    expect(screen.getByText("Hủy")).toBeTruthy();
  });
});
