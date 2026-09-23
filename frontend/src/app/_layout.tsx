import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React from "react";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { Colors } from "@/constants/theme";
import { I18nProvider, useI18n } from "@/hooks/use-i18n";
import { useSchemeName } from "@/hooks/use-theme";

import "react-native-get-random-values";
import "react-native-url-polyfill/auto";
import { Amplify } from "aws-amplify";
import { cognitoUserPoolsTokenProvider } from "aws-amplify/auth/cognito";
import type { KeyValueStorageInterface } from "@aws-amplify/core";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react-native";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import LoginScreen from "@/app/login";

SplashScreen.preventAutoHideAsync();

// One client for the whole app — screens that want to invalidate another
// screen's cached query (e.g. create_report invalidating the "gst" list after
// creating a report) need to share the same QueryClient via this provider.
const queryClient = new QueryClient();

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID!,
    },
  },
});

// ponytail: Amplify persists tokens to disk by default, so a killed-and-relaunched app
// silently restores the session. Swapping to a plain in-memory store means tokens die
// with the process — every cold start requires a fresh PIN entry.
class InMemoryStorage implements KeyValueStorageInterface {
  private store: Record<string, string> = {};
  async setItem(key: string, value: string) {
    this.store[key] = value;
  }
  async getItem(key: string) {
    return this.store[key] ?? null;
  }
  async removeItem(key: string) {
    delete this.store[key];
  }
  async clear() {
    this.store = {};
  }
}

cognitoUserPoolsTokenProvider.setKeyValueStorage(new InMemoryStorage());

// React Navigation ships its own palette, which has no relationship to the app's Colors —
// so navigation chrome (header background, back-button tint, the fill behind a screen
// transition) would disagree with everything the screens draw. Map ours onto its shape.
function navigationTheme(scheme: "light" | "dark") {
  const c = Colors[scheme];
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;

  return {
    ...base,
    dark: scheme === "dark",
    colors: {
      ...base.colors,
      primary: c.accent,
      background: c.background,
      card: c.surface,
      text: c.text,
      border: c.border,
      notification: c.critical,
    },
  };
}

function Root() {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const scheme = useSchemeName();
  const { locale } = useI18n();

  // Amplify starts in "configuring" while it checks for a stored session, then settles to
  // authenticated/unauthenticated. Nothing below renders until we know which one.
  const ready = authStatus !== "configuring";
  const authed = authStatus === "authenticated";

  return (
    <ThemeProvider value={navigationTheme(scheme)}>
      {ready &&
        (authed ? (
          // Keyed on locale: React Navigation's native header/tab-bar options don't
          // reliably propagate a language change through every nested Tab/Stack
          // navigator on their own — remounting the whole tree on switch is what
          // actually refreshes every header and tab label. TanStack Query's cache is
          // keyed independently of this component tree, so screens come back showing
          // their existing cached data immediately, not an empty loading state.
          <Stack
            key={locale}
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: Colors[scheme].background },
            }}
          >
            <Stack.Screen name="(tabs)" />
          </Stack>
        ) : (
          <LoginScreen />
        ))}

      {/* Sibling of the gated content, not a child: the overlay is the single owner of
          hiding the native splash, and whatever is underneath is revealed only by its
          fade — so the login screen can never flash on a cold start. */}
      <AnimatedSplashOverlay ready={ready} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <Authenticator.Provider>
            <Root />
          </Authenticator.Provider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </I18nProvider>
  );
}
