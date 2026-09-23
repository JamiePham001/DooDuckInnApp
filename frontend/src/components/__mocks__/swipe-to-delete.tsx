// Manual mock, wired up per test file via:
//   jest.mock("@/components/swipe-to-delete");
// Swaps the real swipe gesture (see swipe-to-delete.test.tsx for why that's not
// simulated here) for a plain press on the row itself, firing `onDelete`
// directly — so screen-level tests can exercise "what gets deleted" without
// reimplementing PanResponder's touch math. The row's own onPress (e.g.
// navigating into a detail screen) still works underneath: this only adds a
// long-press as the delete trigger, on a testID a test can reach explicitly, so
// it doesn't steal the row's normal press.
import React from "react";
import { Pressable } from "react-native";

export function SwipeToDelete({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  confirmMessage?: string;
  borderRadius: number;
}) {
  return (
    <Pressable testID="mock-swipe-delete" onLongPress={onDelete}>
      {children}
    </Pressable>
  );
}
