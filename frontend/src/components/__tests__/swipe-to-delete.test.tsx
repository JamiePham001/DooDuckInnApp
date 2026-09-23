import React from "react";
import { Text } from "react-native";
import { screen } from "@testing-library/react-native";

import { SwipeToDelete } from "../swipe-to-delete";
import { renderWithProviders as render } from "@/test-utils/render";

// The swipe gesture itself is driven by PanResponder, which derives gestureState
// (dx/dy) from a real sequence of native touch events it tracks internally —
// there's no supported way to fake that through RNTL's fireEvent without
// reimplementing PanResponder's own touch-history math, and doing so would test
// the fake touch sequence more than real user behaviour. That gesture belongs to
// a device-level e2e tool (Detox/Maestro), not this suite. What's tested here,
// and what every screen using this component actually depends on, is the public
// contract: it renders its children untouched, and shows the themed delete
// label underneath them. Screens that need to test *what* gets deleted mock this
// component out entirely (see src/components/__mocks__/swipe-to-delete.tsx) and
// exercise their own onDelete wiring via a plain press instead.
describe("SwipeToDelete", () => {
  it("renders its children", async () => {
    await render(
      <SwipeToDelete onDelete={jest.fn()} borderRadius={0}>
        <Text>Bidfood</Text>
      </SwipeToDelete>,
    );
    expect(screen.getByText("Bidfood")).toBeTruthy();
  });

  it("labels the delete action in the active language", async () => {
    await render(
      <SwipeToDelete onDelete={jest.fn()} borderRadius={0}>
        <Text>Bidfood</Text>
      </SwipeToDelete>,
    );
    expect(screen.getByText("Delete")).toBeTruthy();
  });
});
