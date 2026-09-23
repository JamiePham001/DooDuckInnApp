import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";

import { Card } from "../card";

describe("Card", () => {
  it("renders its children", async () => {
    await render(
      <Card>
        <Text>Bidfood</Text>
      </Card>,
    );
    expect(screen.getByText("Bidfood")).toBeTruthy();
  });
});
