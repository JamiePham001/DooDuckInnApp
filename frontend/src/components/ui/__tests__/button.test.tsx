import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

import { Button } from "../button";

describe("Button", () => {
  it("renders its title and fires onPress when tapped", async () => {
    const onPress = jest.fn();
    await render(<Button title="Create report" onPress={onPress} />);

    await fireEvent.press(screen.getByText("Create report"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while disabled", async () => {
    const onPress = jest.fn();
    await render(<Button title="Create report" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByText("Create report"));

    expect(onPress).not.toHaveBeenCalled();
  });

  it("does not fire onPress while loading, and hides its label behind a spinner", async () => {
    const onPress = jest.fn();
    await render(<Button title="Create report" onPress={onPress} loading />);

    // The title text node is swapped for an ActivityIndicator while loading —
    // this is what the user actually sees, not just an internal disabled flag.
    expect(screen.queryByText("Create report")).toBeNull();

    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("is reachable as an accessible button", async () => {
    await render(<Button title="Send" onPress={jest.fn()} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });
});
