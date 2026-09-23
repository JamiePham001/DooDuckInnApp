import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import CreateVendor from "../create_vendor";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));

describe("CreateVendor (e2e)", () => {
  it("POSTs the entered details and navigates to the new vendor on success", async () => {
    const { push } = require("@/test-utils/expo-router-mock");
    const { calls } = mockFetchRoutes([
      {
        method: "POST",
        match: "/api/suppliers",
        status: 201,
        body: { id: 42, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "0890000000" },
      },
    ]);

    await render(<CreateVendor />);

    await fireEvent.changeText(screen.getByPlaceholderText("Bidfood"), "Bidfood");
    await fireEvent.changeText(screen.getByPlaceholderText("orders@supplier.com"), "orders@bidfood.com");
    await fireEvent.changeText(screen.getByPlaceholderText("08 9000 0000"), "0890000000");
    await fireEvent.press(screen.getByText("Create vendor"));

    await waitFor(() => expect(push).toHaveBeenCalledWith({
      pathname: "/order/[id]",
      params: { id: "42" },
    }));

    const postCall = calls.find((c) => c.method === "POST");
    expect(postCall?.url).toContain("/api/suppliers");
    expect(postCall?.body).toEqual({
      name: "Bidfood",
      email: "orders@bidfood.com",
      phone: "0890000000",
    });
  });

  it("does not submit when name or email is missing", async () => {
    const { calls } = mockFetchRoutes([{ method: "POST", match: "/api/suppliers", body: {} }]);

    await render(<CreateVendor />);

    await fireEvent.press(screen.getByText("Create vendor"));

    // Give any (incorrect) async submission a chance to have fired.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls).toHaveLength(0);
  });
});
