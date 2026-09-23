import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react-native";

import CreateReport from "../create_report";
import { renderWithProviders as render } from "@/test-utils/render";
import { mockFetchRoutes } from "@/test-utils/mock-fetch";

jest.mock("expo-router", () => require("@/test-utils/expo-router-mock"));

// react-native-element-dropdown opens its option list in a Modal/portal that RNTL
// doesn't traverse — swapped for a flat, always-visible list of pressable options
// so this test exercises *our* onChange wiring, not the third-party library's own
// open/close rendering.
jest.mock("react-native-element-dropdown", () => {
  const { View, Pressable, Text } = require("react-native");
  return {
    Dropdown: ({ data, labelField, onChange, placeholder }: any) => (
      <View>
        <Text>{placeholder}</Text>
        {data.map((item: any) => (
          <Pressable key={item[labelField]} onPress={() => onChange(item)}>
            <Text>{item[labelField]}</Text>
          </Pressable>
        ))}
      </View>
    ),
  };
});

describe("CreateReport (e2e)", () => {
  it("is disabled until both a year and a quarter are picked, then POSTs the date range", async () => {
    const { push } = require("@/test-utils/expo-router-mock");
    const { calls } = mockFetchRoutes([
      {
        method: "POST",
        match: "/api/taxes",
        status: 201,
        body: { id: 9, userId: 1, startDate: "2026-01-01", endDate: "2026-03-31", isSent: false },
      },
    ]);

    await render(<CreateReport />);

    // Nothing picked yet — the button must not be pressable.
    await fireEvent.press(screen.getByText("Create report"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(calls).toHaveLength(0);

    await fireEvent.press(screen.getByText("2026"));
    await fireEvent.press(screen.getByText("January - March"));

    await fireEvent.press(screen.getByText("Create report"));

    await waitFor(() => expect(push).toHaveBeenCalledWith({
      pathname: "/gst/[id]",
      params: { id: "9" },
    }));

    const postCall = calls.find((c) => c.method === "POST")!;
    expect(postCall.body).toEqual({ dateStart: "2026-01-01", dateEnd: "2026-03-01" });
  });
});
