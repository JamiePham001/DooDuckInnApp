import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import GstReportEditorPage from "../index";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));
jest.mock("@/components/swipe-to-delete");

describe("GstReportEditorPage (e2e)", () => {
  beforeEach(() => {
    const { useLocalSearchParams } = require("@/test-utils/expo-router-mock");
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "3" });
  });

  it("adds a transaction row via POST when 'Add row' is pressed", async () => {
    const { calls } = mockFetchRoutes([
      { method: "GET", match: "/api/taxes/3", body: { id: 3, startDate: "2026-01-01", endDate: "2026-03-31" } },
      { method: "GET", match: "/api/taxes/3/transactions", body: [] },
      {
        method: "POST",
        match: "/api/taxes/3/transactions",
        status: 201,
        body: { id: 55, taxId: 3, name: "", amount: 0, gst: 0, type: 0 },
      },
    ]);

    await render(<GstReportEditorPage />);

    await waitFor(() => expect(screen.getAllByText("Add row")).toHaveLength(2));

    // Two tables (Sold / Purchases) each have their own "Add row" — the first is Sold.
    await fireEvent.press(screen.getAllByText("Add row")[0]);

    await waitFor(() => {
      const post = calls.find((c) => c.method === "POST" && c.url.includes("/transactions"));
      expect(post).toBeTruthy();
    });

    const post = calls.find((c) => c.method === "POST" && c.url.includes("/transactions"))!;
    expect(post.body).toEqual({ taxId: 3, name: "", amount: null, gst: null, type: 0 });
  });

  it("PATCHes an edited amount after the debounce settles", async () => {
    jest.useFakeTimers();
    const { calls } = mockFetchRoutes([
      { method: "GET", match: "/api/taxes/3", body: { id: 3, startDate: "2026-01-01", endDate: "2026-03-31" } },
      {
        method: "GET",
        match: "/api/taxes/3/transactions",
        body: [{ id: 10, taxId: 3, name: "Bunnings", amount: 100, gst: 10, type: 0 }],
      },
      { method: "PATCH", match: "/update/amount", status: 204, body: {} },
    ]);

    await render(<GstReportEditorPage />);
    await waitFor(() => expect(screen.getByDisplayValue("100")).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue("100"), "150");

    // The debounce (600ms) hasn't fired yet — nothing sent prematurely.
    expect(calls.find((c) => c.method === "PATCH")).toBeUndefined();

    jest.advanceTimersByTime(600);
    jest.useRealTimers();

    await waitFor(() => {
      const patch = calls.find((c) => c.method === "PATCH");
      expect(patch).toBeTruthy();
    });

    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.url).toContain("/api/transactions/10/update/amount");
    expect(patch.url).toContain("amount=150");
  });

  it("clears the amount instead of reverting to 0 when the cell is emptied", async () => {
    jest.useFakeTimers();
    const { calls } = mockFetchRoutes([
      { method: "GET", match: "/api/taxes/3", body: { id: 3, startDate: "2026-01-01", endDate: "2026-03-31" } },
      {
        method: "GET",
        match: "/api/taxes/3/transactions",
        body: [{ id: 10, taxId: 3, name: "Bunnings", amount: 100, gst: 10, type: 0 }],
      },
      { method: "PATCH", match: "/update/amount", status: 204, body: {} },
    ]);

    await render(<GstReportEditorPage />);
    await waitFor(() => expect(screen.getByDisplayValue("100")).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue("100"), "");

    jest.advanceTimersByTime(600);
    jest.useRealTimers();

    await waitFor(() => {
      const patch = calls.find((c) => c.method === "PATCH");
      expect(patch).toBeTruthy();
    });

    // No `amount` query param at all — the backend treats that as clearing the value,
    // not as amount=0.
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.url).toContain("/api/transactions/10/update/amount");
    expect(patch.url).not.toContain("amount=");
  });

  it("deletes a transaction via DELETE when confirmed", async () => {
    const { calls } = mockFetchRoutes([
      { method: "GET", match: "/api/taxes/3", body: { id: 3, startDate: "2026-01-01", endDate: "2026-03-31" } },
      {
        method: "GET",
        match: "/api/taxes/3/transactions",
        body: [{ id: 10, taxId: 3, name: "Bunnings", amount: 100, gst: 10, type: 0 }],
      },
      { method: "DELETE", match: "/api/transactions/10", status: 204, body: {} },
    ]);

    await render(<GstReportEditorPage />);
    await waitFor(() => expect(screen.getByDisplayValue("Bunnings")).toBeTruthy());

    // SwipeToDelete owns its own confirmation modal internally (see
    // swipe-to-delete.test.tsx) — it's mocked out here to a plain long-press
    // that fires onDelete directly, so this only exercises GstTable's wiring.
    await fireEvent(screen.getByTestId("mock-swipe-delete"), "longPress");

    await waitFor(() => {
      const del = calls.find((c) => c.method === "DELETE");
      expect(del).toBeTruthy();
    });
    expect(calls.find((c) => c.method === "DELETE")!.url).toContain("/api/transactions/10");
  });

  it("only POSTs the send-report request once the confirmation modal is accepted", async () => {
    const { calls } = mockFetchRoutes([
      { method: "GET", match: "/api/taxes/3", body: { id: 3, startDate: "2026-01-01", endDate: "2026-03-31" } },
      { method: "GET", match: "/api/taxes/3/transactions", body: [] },
      { method: "POST", match: "/send-report", status: 204, body: {} },
    ]);

    await render(<GstReportEditorPage />);
    await waitFor(() => expect(screen.getAllByText("Add row")).toHaveLength(2));

    await fireEvent.press(screen.getByText("Send"));

    // Pressing "Send" only opens the confirmation modal — nothing sent yet.
    const confirmText = await screen.findByText(
      "Are you sure you want to email this report?",
    );
    expect(confirmText).toBeTruthy();
    expect(calls.find((c) => c.method === "POST")).toBeUndefined();

    await fireEvent.press(screen.getByText("I'm sure"));

    await waitFor(() => {
      const post = calls.find((c) => c.method === "POST");
      expect(post).toBeTruthy();
    });
    expect(calls.find((c) => c.method === "POST")!.url).toContain(
      "/api/taxes/3/send-report",
    );
  });

  it("does not send the report when the confirmation modal is cancelled", async () => {
    const { calls } = mockFetchRoutes([
      { method: "GET", match: "/api/taxes/3", body: { id: 3, startDate: "2026-01-01", endDate: "2026-03-31" } },
      { method: "GET", match: "/api/taxes/3/transactions", body: [] },
    ]);

    await render(<GstReportEditorPage />);
    await waitFor(() => expect(screen.getAllByText("Add row")).toHaveLength(2));

    await fireEvent.press(screen.getByText("Send"));
    await screen.findByText("Are you sure you want to email this report?");

    await fireEvent.press(screen.getByText("Cancel"));

    await waitFor(() =>
      expect(
        screen.queryByText("Are you sure you want to email this report?"),
      ).toBeNull(),
    );
    expect(calls.find((c) => c.method === "POST")).toBeUndefined();
  });
});
