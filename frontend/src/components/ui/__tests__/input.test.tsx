import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";

import { Input } from "../input";

describe("Input", () => {
  it("renders its label and placeholder", async () => {
    await render(
      <Input label="Email" placeholder="orders@supplier.com" value="" onChangeText={jest.fn()} />,
    );

    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByPlaceholderText("orders@supplier.com")).toBeTruthy();
  });

  it("reports what the user types via onChangeText", async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Name" value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByDisplayValue(""), "Bidfood");

    expect(onChangeText).toHaveBeenCalledWith("Bidfood");
  });

  it("shows an error message when one is set", async () => {
    await render(
      <Input label="Email" value="bad" onChangeText={jest.fn()} error="Enter a valid email address." />,
    );

    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
  });

  it("shows no error message when none is set", async () => {
    await render(<Input label="Email" value="" onChangeText={jest.fn()} />);

    expect(screen.queryByText(/valid email/)).toBeNull();
  });
});
