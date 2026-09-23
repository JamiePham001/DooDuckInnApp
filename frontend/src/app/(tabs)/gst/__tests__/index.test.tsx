import React from "react";
import { screen, waitFor } from "@testing-library/react-native";

import GstListPage from "../index";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));
// The row itself uses SwipeToDelete — its real gesture isn't under test here
// (see swipe-to-delete.test.tsx), only what the list renders and how it navigates.
jest.mock("@/components/swipe-to-delete");

describe("GstListPage", () => {
  it("renders each report's date range and Sent/Draft status", async () => {
    mockFetchRoutes([
      {
        method: "GET",
        match: "/api/taxes",
        body: [
          { id: 1, userId: 1, startDate: "2026-01-01", endDate: "2026-03-31", isSent: true },
          { id: 2, userId: 1, startDate: "2026-04-01", endDate: "2026-06-30", isSent: false },
        ],
      },
    ]);

    await render(<GstListPage />);

    await waitFor(() => expect(screen.getByText("January - March 2026")).toBeTruthy());
    expect(screen.getByText("April - June 2026")).toBeTruthy();
    expect(screen.getByText("Sent")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("shows an empty state when there are no reports yet", async () => {
    mockFetchRoutes([{ method: "GET", match: "/api/taxes", body: [] }]);

    await render(<GstListPage />);

    await waitFor(() => expect(screen.getByText("No reports yet")).toBeTruthy());
  });

  it("shows an error state when the reports fail to load", async () => {
    mockFetchRoutes([{ method: "GET", match: "/api/taxes", status: 500, body: {} }]);

    await render(<GstListPage />);

    await waitFor(() => expect(screen.getByText("Couldn't load reports")).toBeTruthy());
  });
});
