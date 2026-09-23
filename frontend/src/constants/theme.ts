/**
 * Design tokens for the app. Every colour, radius, type style, shadow and motion timing lives
 * here — screens should read these rather than hardcoding values, so light/dark and future
 * retunes happen in one place.
 */

import "@/global.css";

import { Platform, StyleSheet } from "react-native";
import { Easing } from "react-native-reanimated";

export const Colors = {
  light: {
    // canvas + surfaces
    background: "#F1F1F3",
    surface: "#FFFFFF",
    surfacePressed: "#EDEEF0",
    border: "#E3E5E9",
    // type
    text: "#11181C",
    textSecondary: "#60646C",
    textOnAccent: "#FFFFFF",
    // action
    accent: "#1877F2",
    accentPressed: "#1461C7",
    accentSoft: "#E8F1FE",
    // digest priority / status
    critical: "#D32F2F",
    high: "#C2410C",
    medium: "#2E7D32",
    low: "#6B7280",
    // chrome — the tab bar is a solid blue block, so its tints are white / pale blue
    // rather than the usual text colours.
    tabBar: "#1877F2",
    tabActive: "#FFFFFF",
    tabInactive: "#ACC8EE",
  },
  dark: {
    // Not pure black: a #000 canvas makes the #18191C card read as a floating grey blob
    // instead of a lifted surface, and shadows are invisible against it.
    background: "#0C0D0F",
    surface: "#18191C",
    surfacePressed: "#232529",
    border: "#2A2D32",
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    textOnAccent: "#FFFFFF",
    accent: "#3C87F7",
    accentPressed: "#2E6FD0",
    accentSoft: "#16304F",
    critical: "#FF6B6B",
    high: "#FFA24D",
    medium: "#66BB6A",
    low: "#9BA1A6",
    tabBar: "#1877F2",
    tabActive: "#FFFFFF",
    tabInactive: "#ACC8EE",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "700" },
  title: { fontSize: 24, lineHeight: 30, fontWeight: "700" },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: "600" },
  body: { fontSize: 17, lineHeight: 24, fontWeight: "500" },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: "700" },
  secondary: { fontSize: 15, lineHeight: 21, fontWeight: "500" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "600" },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Shared motion constants so every animation in the app agrees on timing and feel. */
export const Motion = {
  fast: 150,
  base: 220,
  slow: 320,
  ease: Easing.out(Easing.cubic),
  stagger: 45,
} as const;

// ponytail: one shadow table for both schemes — the hairline border does the elevation work in
// dark mode, where a shadow against a near-black canvas is invisible anyway.
export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: "#0B1220",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: { boxShadow: "0 2px 8px rgba(11,18,32,0.08)" },
  }),
  raised: Platform.select({
    ios: {
      shadowColor: "#0B1220",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: { boxShadow: "0 6px 16px rgba(11,18,32,0.12)" },
  }),
} as const;

export const Hairline = StyleSheet.hairlineWidth;

// Must move together with the tab bar's own height/padding in (tabs)/_layout.tsx —
// SettingsAccordion positions itself off this value.
export const BottomTabInset = Platform.select({ ios: 56, android: 76 }) ?? 0;
export const MaxContentWidth = 800;
