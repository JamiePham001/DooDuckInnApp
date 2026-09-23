import React from "react";
import { Alert, Text } from "react-native";
import { screen, waitFor } from "@testing-library/react-native";
import { fetchAuthSession } from "aws-amplify/auth";

import { AuthTokenProvider, useAuthToken } from "../use-auth-token";
import { I18nProvider } from "../use-i18n";
import { render } from "@/test-utils/render";

jest.mock("aws-amplify/auth", () => ({
  fetchAuthSession: jest.fn(),
}));

const mockFetchAuthSession = fetchAuthSession as jest.Mock;

function Consumer() {
  const { jwtToken, tokenError } = useAuthToken();
  return (
    <>
      <Text testID="token">{jwtToken}</Text>
      <Text testID="error">{String(tokenError)}</Text>
    </>
  );
}

describe("AuthTokenProvider", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("fetches the ID token once and shares it with consumers", async () => {
    mockFetchAuthSession.mockResolvedValue({
      tokens: { idToken: { toString: () => "real-jwt" } },
    });

    await render(
      <I18nProvider>
        <AuthTokenProvider>
          <Consumer />
        </AuthTokenProvider>
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("token").props.children).toBe("real-jwt"));
    expect(mockFetchAuthSession).toHaveBeenCalledTimes(1);
  });

  it("sets tokenError and alerts once when the session has no ID token", async () => {
    mockFetchAuthSession.mockResolvedValue({ tokens: undefined });

    await render(
      <I18nProvider>
        <AuthTokenProvider>
          <Consumer />
        </AuthTokenProvider>
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("error").props.children).toBe("true"));
    expect(screen.getByTestId("token").props.children).toBe("");
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith("Error", "Could not retrieve authentication token.");
  });

  it("sets tokenError when fetchAuthSession itself rejects", async () => {
    mockFetchAuthSession.mockRejectedValue(new Error("network down"));

    await render(
      <I18nProvider>
        <AuthTokenProvider>
          <Consumer />
        </AuthTokenProvider>
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("error").props.children).toBe("true"));
  });
});
