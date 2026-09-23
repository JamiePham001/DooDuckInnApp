import React from "react";
import { render, type RenderOptions } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { I18nProvider } from "@/hooks/use-i18n";
import { AuthTokenContext, type AuthTokenContextValue } from "@/hooks/use-auth-token";

type ProviderOptions = {
  /** Fake auth state injected directly — bypasses the real fetchAuthSession flow. */
  auth?: Partial<AuthTokenContextValue>;
};

const DEFAULT_AUTH: AuthTokenContextValue = { jwtToken: "test-jwt-token", tokenError: false };

/**
 * Renders a component wrapped in the same providers it gets in the real app
 * (i18n, react-query, auth token), scoped down to what's actually needed in a
 * test: a fresh QueryClient per render (no cross-test cache bleed, retries off
 * so failed-request tests don't sit through backoff delays) and an auth value
 * injected directly instead of going through the real Amplify session fetch.
 */
export async function renderWithProviders(
  ui: React.ReactElement,
  { auth, ...options }: ProviderOptions & RenderOptions = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const authValue: AuthTokenContextValue = { ...DEFAULT_AUTH, ...auth };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <AuthTokenContext.Provider value={authValue}>
            {children}
          </AuthTokenContext.Provider>
        </QueryClientProvider>
      </I18nProvider>
    );
  }

  return { queryClient, ...(await render(ui, { wrapper: Wrapper, ...options })) };
}

export * from "@testing-library/react-native";
