import React from "react";
import { screen, waitFor, fireEvent } from "@testing-library/react-native";

import HomeScreen from "../home";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

describe("HomeScreen", () => {
  it("renders the digest, sorted and labelled by priority, once loaded", async () => {
    mockFetchRoutes([
      {
        method: "GET",
        match: "/api/digests/latest",
        body: [
          {
            id: 1,
            gmailMessageId: "m1",
            senderName: "Bidfood",
            senderEmail: "orders@bidfood.com",
            subject: "Invoice overdue",
            summary: "Your invoice is 3 days overdue.",
            priority: 0, // Critical
            receivedAt: "2026-01-01T00:00:00Z",
          },
          {
            id: 2,
            gmailMessageId: "m2",
            senderName: "Newsletter Co",
            senderEmail: "news@example.com",
            subject: "Weekly deals",
            summary: "Check out this week's specials.",
            priority: 3, // Low
            receivedAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
    ]);

    await render(<HomeScreen />);

    await waitFor(() => expect(screen.getByText("Bidfood")).toBeTruthy());
    expect(screen.getByText("Newsletter Co")).toBeTruthy();
    expect(screen.getByText("Critical")).toBeTruthy();
    expect(screen.getByText("Low")).toBeTruthy();
    expect(screen.getByText(/2 emails/)).toBeTruthy();
    expect(screen.getByText(/1 need attention/)).toBeTruthy();
  });

  it("shows an empty state when there is nothing in the digest", async () => {
    mockFetchRoutes([{ method: "GET", match: "/api/digests/latest", body: [] }]);

    await render(<HomeScreen />);

    await waitFor(() => expect(screen.getByText("All clear")).toBeTruthy());
  });

  it("shows an error card with a working retry on request failure", async () => {
    const { calls } = mockFetchRoutes([
      { method: "GET", match: "/api/digests/latest", status: 500, body: {} },
    ]);

    await render(<HomeScreen />);

    await waitFor(() => expect(screen.getByText("Couldn't load your emails")).toBeTruthy());
    const callsBeforeRetry = calls.length;

    await fireEvent.press(screen.getByText("Try again"));

    await waitFor(() => expect(calls.length).toBeGreaterThan(callsBeforeRetry));
  });
});
