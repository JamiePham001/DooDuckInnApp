import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import VendorDetailPage from "../index";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));
jest.mock("@/components/swipe-to-delete");

describe("VendorDetailPage (e2e)", () => {
  beforeEach(() => {
    const { useLocalSearchParams } = require("@/test-utils/expo-router-mock");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "7" });
  });

  it("adds an item via POST when 'Add item' is pressed", async () => {
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "" },
      },
      { method: "GET", match: "/api/suppliers/7/items", body: [] },
      {
        method: "POST",
        match: "/api/suppliers/7/item",
        status: 201,
        body: { id: 99, supplierId: 7, name: "", quantity: 0 },
      },
    ]);

    await render(<VendorDetailPage />);
    await waitFor(() => expect(screen.getByText("Add item")).toBeTruthy());

    await fireEvent.press(screen.getByText("Add item"));

    await waitFor(() => {
      const post = calls.find((c) => c.method === "POST");
      expect(post).toBeTruthy();
    });
    expect(calls.find((c) => c.method === "POST")!.url).toContain("/api/suppliers/7/item");
  });

  it("PATCHes an edited quantity after the debounce settles", async () => {
    jest.useFakeTimers();
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "" },
      },
      {
        method: "GET",
        match: "/api/suppliers/7/items",
        body: [{ id: 20, supplierId: 7, name: "Chicken breast", quantity: 5 }],
      },
      { method: "PATCH", match: "/update/quantity", status: 204, body: {} },
    ]);

    await render(<VendorDetailPage />);
    await waitFor(() => expect(screen.getByDisplayValue("5")).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue("5"), "12");

    expect(calls.find((c) => c.method === "PATCH")).toBeUndefined();

    jest.advanceTimersByTime(600);
    jest.useRealTimers();

    await waitFor(() => expect(calls.find((c) => c.method === "PATCH")).toBeTruthy());
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.url).toContain("/api/items/20/update/quantity");
    expect(patch.url).toContain("qty=12");
  });

  it("deletes an item via DELETE when confirmed", async () => {
    const { calls } = mockFetchRoutes([
      {
        method: "GET",
        match: "/api/suppliers/7",
        body: { id: 7, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "" },
      },
      {
        method: "GET",
        match: "/api/suppliers/7/items",
        body: [{ id: 20, supplierId: 7, name: "Chicken breast", quantity: 5 }],
      },
      { method: "DELETE", match: "/api/items/20", status: 204, body: {} },
    ]);

    await render(<VendorDetailPage />);
    await waitFor(() => expect(screen.getByDisplayValue("Chicken breast")).toBeTruthy());

    await fireEvent(screen.getByTestId("mock-swipe-delete"), "longPress");

    await waitFor(() => expect(calls.find((c) => c.method === "DELETE")).toBeTruthy());
    expect(calls.find((c) => c.method === "DELETE")!.url).toContain("/api/items/20");
  });
});
