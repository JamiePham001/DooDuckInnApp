/* eslint-disable no-undef */
// Tells React's reconciler this environment supports act() — without it, every
// state update triggered from inside an async effect (which is most of ours)
// logs a spurious "not configured to support act" warning even though
// RNTL's fireEvent/waitFor are already wrapping things in act() correctly.
global.IS_REACT_ACT_ENVIRONMENT = true;

require("react-native-gesture-handler/jestSetup");

// Official mock: animations resolve synchronously so assertions can run
// immediately instead of needing to fast-forward fake timers.
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

// Official mock — in-memory implementation, resets between tests automatically
// since each test file gets a fresh module registry. Exposed as both the plain
// CJS shape (what our own `import AsyncStorage from "..."` resolves via babel's
// interop) and `.default` (what aws-amplify's own loader reads via a raw
// `require(...).default`, bypassing that interop) — same mock instance either way.
jest.mock("@react-native-async-storage/async-storage", () => {
  const mock = require("@react-native-async-storage/async-storage/jest/async-storage-mock");
  return { ...mock, default: mock };
});

// react-native-localize ships a native TurboModule — I18nProvider calls it on every
// mount (to resolve the device's default language when nothing is saved yet), so
// this needs a global stub rather than a per-test one. Individual tests that care
// about its actual return value override it with jest.spyOn.
jest.mock("react-native-localize", () => ({
  findBestLanguageTag: jest.fn(() => ({ languageTag: "en", isRTL: false })),
}));

// expo-router pulls in the real native navigation stack — anything that imports it
// transitively (use-auth-token.tsx does, to redirect to /login on auth failure) needs
// this mocked globally, not just in the screen tests that explicitly interact with
// navigation. Individual test files can still jest.mock() their own richer version
// (e.g. to override useLocalSearchParams per test); this is just the floor.
jest.mock("expo-router", () => require("./src/test-utils/expo-router-mock"));

// expo-splash-screen touches native modules at import time (app/_layout.tsx calls
// preventAutoHideAsync() at module scope) — screens under test don't render the
// splash overlay, but anything importing the module transitively needs this stub.
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve(true)),
}));
