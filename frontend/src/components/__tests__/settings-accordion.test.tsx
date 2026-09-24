import React from "react";
import { screen, fireEvent } from "@testing-library/react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

import { SettingsAccordion } from "../settings-accordion";
import { renderWithProviders as render } from "@/test-utils/render";

jest.mock("@aws-amplify/ui-react-native", () => ({
  useAuthenticator: jest.fn(),
}));

// react-native-element-dropdown opens its option list in a Modal/portal that RNTL
// doesn't traverse — swapped for a flat, always-visible list of pressable options
// so this test exercises *our* onChange wiring, not the third-party library's own
// open/close rendering.
jest.mock("react-native-element-dropdown", () => {
  const { View, Pressable, Text } = require("react-native");
  return {
    Dropdown: ({ data, labelField, onChange, placeholder }: any) => (
      <View>
        <Text>{placeholder}</Text>
        {data.map((item: any) => (
          <Pressable key={item[labelField]} onPress={() => onChange(item)}>
            <Text>{item[labelField]}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

const mockUseAuthenticator = useAuthenticator as jest.Mock;

describe("SettingsAccordion", () => {
  const signOut = jest.fn();

  beforeEach(() => {
    signOut.mockClear();
    mockUseAuthenticator.mockReturnValue({ signOut });
  });

  it("signs the user out when Log Out is pressed", async () => {
    await render(<SettingsAccordion visible onClose={jest.fn()} />);

    await fireEvent.press(screen.getByText("Log Out"));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("opens a language picker offering English and Vietnamese", async () => {
    await render(<SettingsAccordion visible onClose={jest.fn()} />);

    await fireEvent.press(screen.getByText("Language"));

    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText("Tiếng Việt")).toBeTruthy();
  });

  it("closes the accordion as soon as the language picker opens", async () => {
    const onClose = jest.fn();
    await render(<SettingsAccordion visible onClose={onClose} />);

    await fireEvent.press(screen.getByText("Language"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("switches language when a picker option is chosen", async () => {
    await render(<SettingsAccordion visible onClose={jest.fn()} />);

    await fireEvent.press(screen.getByText("Language"));
    await fireEvent.press(screen.getByText("Tiếng Việt"));

    // Confirmed via a re-render: switching language re-labels this very row.
    await screen.findByText("Ngôn ngữ");
  });
});
