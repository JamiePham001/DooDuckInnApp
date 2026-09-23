import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import SendOrder from "../send_order";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));

describe("SendOrder (e2e)", () => {
  beforeEach(() => {
    const { useLocalSearchParams } = require("@/test-utils/expo-router-mock");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "7" });
  });

  it("defaults to the vendor's own email and POSTs the order on send", async () => {
    const { back } = require("@/test-utils/expo-router-mock");
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "" },
      },
      { method: "POST", match: "/send-order", status: 204, body: {} },
    ]);

    await render(<SendOrder />);

    await waitFor(() => expect(screen.getByDisplayValue("orders@bidfood.com")).toBeTruthy());

    await fireEvent.press(screen.getByText("Send order"));

    await waitFor(() => expect(back).toHaveBeenCalledTimes(1));

    const postCall = calls.find((c) => c.method === "POST")!;
    expect(postCall.url).toContain("/api/suppliers/7/send-order");
    expect(postCall.body).toMatchObject({ RecipientEmail: "orders@bidfood.com" });
  });

  it("lets the user redirect the order to a different address", async () => {
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "" },
      },
      { method: "POST", match: "/send-order", status: 204, body: {} },
    ]);

    await render(<SendOrder />);
    await waitFor(() => expect(screen.getByDisplayValue("orders@bidfood.com")).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue("orders@bidfood.com"), "warehouse@bidfood.com");
    await fireEvent.press(screen.getByText("Send order"));

    await waitFor(() => {
      const postCall = calls.find((c) => c.method === "POST");
      expect(postCall?.body).toMatchObject({ RecipientEmail: "warehouse@bidfood.com" });
    });
  });

  it("does not send when the email is invalid", async () => {
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "" },
      },
      { method: "POST", match: "/send-order", body: {} },
    ]);

    await render(<SendOrder />);
    await waitFor(() => expect(screen.getByDisplayValue("orders@bidfood.com")).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue("orders@bidfood.com"), "not-an-email");
    await fireEvent.press(screen.getByText("Send order"));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls.find((c) => c.method === "POST")).toBeUndefined();
  });
});
