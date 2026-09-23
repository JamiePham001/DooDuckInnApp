import React from "react";
import { screen, waitFor } from "@testing-library/react-native";

import OrderPage from "../index";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));
jest.mock("@/components/swipe-to-delete");

describe("OrderPage", () => {
  it("renders each supplier's name and email", async () => {
    mockFetchRoutes([
      {
        method: "GET",
        match: "/api/users/me/suppliers",
        body: [
          { id: 1, user_id: 1, name: "Bidfood", email: "orders@bidfood.com", phone: "" },
          { id: 2, user_id: 1, name: "PFD", email: "orders@pfd.com", phone: "" },
        ],
      },
    ]);

    await render(<OrderPage />);

    await waitFor(() => expect(screen.getByText("Bidfood")).toBeTruthy());
    expect(screen.getByText("orders@bidfood.com")).toBeTruthy();
    expect(screen.getByText("PFD")).toBeTruthy();
  });

  it("shows an empty state when there are no suppliers yet", async () => {
    mockFetchRoutes([{ method: "GET", match: "/api/users/me/suppliers", body: [] }]);

    await render(<OrderPage />);

    await waitFor(() => expect(screen.getByText("No suppliers yet")).toBeTruthy());
  });

  it("shows an error state when suppliers fail to load", async () => {
    mockFetchRoutes([
      { method: "GET", match: "/api/users/me/suppliers", status: 500, body: {} },
    ]);

    await render(<OrderPage />);

    await waitFor(() => expect(screen.getByText("Couldn't load suppliers")).toBeTruthy());
  });
});
