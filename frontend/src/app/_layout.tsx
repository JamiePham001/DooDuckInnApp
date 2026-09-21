import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  useEffect(() => {
    // Amplify starts in "configuring" while it checks for a stored session, then
    // settles to authenticated/unauthenticated — only hide the splash once we know
    // which screen to show, so cold start never flashes the login page.
    if (authStatus !== "configuring") {
      SplashScreen.hideAsync();
    }
  }, [authStatus]);

  if (authStatus === "configuring") return null;
  return authStatus === "authenticated" ? children : <LoginScreen />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Authenticator.Provider>
          <AuthGate>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <AnimatedSplashOverlay />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
              </Stack>
            </ThemeProvider>
          </AuthGate>
        </Authenticator.Provider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
