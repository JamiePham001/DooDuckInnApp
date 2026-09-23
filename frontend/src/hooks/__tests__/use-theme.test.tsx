import { renderHook } from "@testing-library/react-native";

import { useSchemeName, useTheme } from "../use-theme";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: jest.fn(),
}));

const mockUseColorScheme = useColorScheme as unknown as jest.Mock;

describe("useSchemeName", () => {
  it("returns 'dark' when the device scheme is dark", async () => {
    mockUseColorScheme.mockReturnValue("dark");
    const { result } = await renderHook(() => useSchemeName());
    expect(result.current).toBe("dark");
  });

  it("returns 'light' when the device scheme is light", async () => {
    mockUseColorScheme.mockReturnValue("light");
    const { result } = await renderHook(() => useSchemeName());
    expect(result.current).toBe("light");
  });

  // The real bug this hook exists to fix: RN's useColorScheme can return
  // 'unspecified' (Android) or null, neither of which is a key of Colors —
  // indexing Colors with either used to hand back `undefined` and crash every
  // themed colour read downstream.
  it("falls back to 'light' for a null scheme", async () => {
    mockUseColorScheme.mockReturnValue(null);
    const { result } = await renderHook(() => useSchemeName());
    expect(result.current).toBe("light");
  });

  it("falls back to 'light' for an 'unspecified' scheme", async () => {
    mockUseColorScheme.mockReturnValue("unspecified");
    const { result } = await renderHook(() => useSchemeName());
    expect(result.current).toBe("light");
  });
});

describe("useTheme", () => {
  it("returns the light palette for a light scheme", async () => {
    mockUseColorScheme.mockReturnValue("light");
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
  });

  it("returns the dark palette for a dark scheme", async () => {
    mockUseColorScheme.mockReturnValue("dark");
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.dark);
  });
});
