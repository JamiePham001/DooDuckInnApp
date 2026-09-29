import React from "react";
import { Alert, Text } from "react-native";
import { act, screen, waitFor } from "@testing-library/react-native";
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
    mockFetchAuthSession.mockClear();
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

  it("re-fetches the token periodically instead of only once at launch", async () => {
    // Asserting the interval is actually registered (rather than advancing fake timers
    // through render()/waitFor()'s own async machinery, which fight each other) — a stale
    // token sitting unrefreshed for the rest of the session is exactly the bug this fixes.
    const setIntervalSpy = jest.spyOn(global, "setInterval");
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
    await waitFor(() => expect(mockFetchAuthSession).toHaveBeenCalledTimes(1));

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5 * 60 * 1000);

    const [intervalCallback] = setIntervalSpy.mock.calls[0];
    await act(async () => {
      await intervalCallback();
    });
    expect(mockFetchAuthSession).toHaveBeenCalledTimes(2);
  });
});
