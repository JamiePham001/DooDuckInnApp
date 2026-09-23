import React from "react";
import { Text } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";

import { PressableScale } from "../pressable-scale";

describe("PressableScale", () => {
  it("fires onPress when tapped", async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale onPress={onPress}>
        <Text>Call vendor</Text>
      </PressableScale>,
    );

    await fireEvent.press(screen.getByText("Call vendor"));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire onPress while disabled", async () => {
    const onPress = jest.fn();
    await render(
      <PressableScale onPress={onPress} disabled>
        <Text>Call vendor</Text>
      </PressableScale>,
    );

    await fireEvent.press(screen.getByText("Call vendor"));

    expect(onPress).not.toHaveBeenCalled();
  });
});
