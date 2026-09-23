import React from "react";
import { Alert } from "react-native";
import { screen, fireEvent } from "@testing-library/react-native";
import { useAuthenticator } from "@aws-amplify/ui-react-native";

import { SettingsAccordion } from "../settings-accordion";
import { renderWithProviders as render } from "@/test-utils/render";

jest.mock("@aws-amplify/ui-react-native", () => ({
  useAuthenticator: jest.fn(),
}));

const mockUseAuthenticator = useAuthenticator as jest.Mock;

describe("SettingsAccordion", () => {
  const signOut = jest.fn();

  beforeEach(() => {
    signOut.mockClear();
    mockUseAuthenticator.mockReturnValue({ signOut });
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("signs the user out when Log Out is pressed", async () => {
    await render(<SettingsAccordion visible onClose={jest.fn()} />);

    await fireEvent.press(screen.getByText("Log Out"));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("opens a language picker offering English and Vietnamese", async () => {
    await render(<SettingsAccordion visible onClose={jest.fn()} />);

    await fireEvent.press(screen.getByText("Language"));

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [title, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    expect(title).toBe("Choose a language");

    const labels = buttons.map((b: { text: string }) => b.text);
    // The current language is marked with a check, so the option label
    // includes it rather than the bare name — checking `toContain` covers both.
    expect(labels.some((l: string) => l.includes("English"))).toBe(true);
    expect(labels.some((l: string) => l.includes("Tiếng Việt"))).toBe(true);
    expect(labels).toContain("Cancel");
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
    const [, , buttons] = (Alert.alert as jest.Mock).mock.calls[0];
    const vietnamese = buttons.find((b: { text: string }) => b.text.includes("Tiếng Việt"));

    vietnamese.onPress();

    // Confirmed via a re-render: switching language re-labels this very row.
    await screen.findByText("Ngôn ngữ");
  });
});
