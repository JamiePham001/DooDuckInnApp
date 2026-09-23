// Manual mock for `expo-router`, wired up per test file via:
//   jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));
// Real expo-router pulls in the whole native navigation stack, which is unnecessary
// (and largely unmockable in a plain component test) — screens only ever touch this
// small surface: useRouter().push/back, useLocalSearchParams, and <Stack.Screen>
// purely for its `options` prop (title etc.), which we don't assert on here.
import React from "react";

export const push = jest.fn();
export const back = jest.fn();
export const replace = jest.fn();

export function useRouter() {
  return { push, back, replace };
}

// Tests override the return value per-case with:
//   (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "5" })
export const useLocalSearchParams = jest.fn(() => ({}));

export function useFocusEffect(effect: () => void | (() => void)) {
  React.useEffect(effect, [effect]);
}

export const router = { push, back, replace };

export function Stack({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
Stack.Screen = function StackScreen() {
  return null;
};

export function Link({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
