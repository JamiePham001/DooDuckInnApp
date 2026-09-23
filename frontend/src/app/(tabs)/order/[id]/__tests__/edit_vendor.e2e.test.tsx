import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import EditVendor from "../edit_vendor";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));

describe("EditVendor (e2e)", () => {
  beforeEach(() => {
    const { useLocalSearchParams } = require("@/test-utils/expo-router-mock");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "7" });
  });

  it("prefills from the current supplier, then PATCHes edited fields", async () => {
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "old@bidfood.com", phone: "0800000000" },
      },
      { method: "PATCH", match: "/update/details", status: 204, body: {} },
    ]);

    await render(<EditVendor />);

    await waitFor(() => expect(screen.getByDisplayValue("Bidfood")).toBeTruthy());
    expect(screen.getByDisplayValue("old@bidfood.com")).toBeTruthy();

    await fireEvent.changeText(screen.getByDisplayValue("old@bidfood.com"), "new@bidfood.com");
    await fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => {
      const patch = calls.find((c) => c.method === "PATCH");
      expect(patch).toBeTruthy();
    });

    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.url).toContain("/api/suppliers/7/update/details");
    expect(patch.body).toEqual({ name: "Bidfood", email: "new@bidfood.com", phone: "0800000000" });
  });

  it("blocks the save and shows nothing sent when the email is invalid", async () => {
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "old@bidfood.com", phone: "" },
      },
      { method: "PATCH", match: "/update/details", body: {} },
    ]);

    await render(<EditVendor />);
    await waitFor(() => expect(screen.getByDisplayValue("Bidfood")).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue("old@bidfood.com"), "not-an-email");
    await fireEvent.press(screen.getByText("Save changes"));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls.find((c) => c.method === "PATCH")).toBeUndefined();
  });
});
