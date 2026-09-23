import React from "react";
import { render, screen } from "@testing-library/react-native";

import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(() => "light"),
}));

const mockUseColorScheme = useColorScheme as jest.Mock;

describe("ThemedText", () => {
  it("renders its children", async () => {
    await render(<ThemedText>Doo Duck Inn</ThemedText>);
    expect(screen.getByText("Doo Duck Inn")).toBeTruthy();
  });

  it("colours text with the theme's text colour by default", async () => {
    mockUseColorScheme.mockReturnValue("light");
    await render(<ThemedText>Hello</ThemedText>);
    const style = screen.getByText("Hello").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.color).toBe(Colors.light.text);
  });

  it("honours an explicit themeColor override", async () => {
    mockUseColorScheme.mockReturnValue("light");
    await render(<ThemedText themeColor="critical">Error</ThemedText>);
    const style = screen.getByText("Error").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.color).toBe(Colors.light.critical);
  });

  it("switches palette when the device scheme is dark", async () => {
    mockUseColorScheme.mockReturnValue("dark");
    await render(<ThemedText>Hello</ThemedText>);
    const style = screen.getByText("Hello").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.color).toBe(Colors.dark.text);
  });
});

describe("ThemedView", () => {
  it("applies the theme's background colour by default", async () => {
    mockUseColorScheme.mockReturnValue("light");
    await render(<ThemedView testID="view" />);
    const style = screen.getByTestId("view").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.backgroundColor).toBe(Colors.light.background);
  });

  it("applies a named theme colour when `type` is given", async () => {
    mockUseColorScheme.mockReturnValue("light");
    await render(<ThemedView type="surface" testID="view" />);
    const style = screen.getByTestId("view").props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
    expect(flat.backgroundColor).toBe(Colors.light.surface);
  });
});
