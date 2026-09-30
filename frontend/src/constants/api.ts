import { Platform } from "react-native";

// Flip this and save to switch targets — hot-reloads immediately, unlike editing
// EXPO_PUBLIC_API_HOST in .env.local which needs a full Metro restart (env vars
// are inlined into the bundle once, at build time).
export const USE_LOCAL_BACKEND = false;

// __DEV__ is false in any release/EAS build — fails loudly instead of shipping an app that
// silently can't reach anything, if this ever gets left on by accident.
if (USE_LOCAL_BACKEND && !__DEV__) {
  throw new Error(
    "USE_LOCAL_BACKEND must be false before building for release.",
  );
}

const DEPLOYED_API_BASE_URL =
  "https://laj5ez2gk1.execute-api.ap-southeast-2.amazonaws.com/prod";

// "10.0.2.2" only resolves inside the Android *emulator* — it's a loopback alias
// back to the host machine that the emulator's virtual network sets up specially.
// A physical device has no route to it at all, so requests just hang until they
// time out rather than failing fast.
//
// For a physical device, set EXPO_PUBLIC_API_HOST in .env.local to your dev
// machine's LAN IP (e.g. "192.168.1.23", found via `ipconfig` on Windows /
// `ifconfig` on Mac/Linux) — both devices need to be on the same Wi-Fi, and the
// backend needs to be listening on 0.0.0.0, not just localhost (see
// launchSettings.json).
export const API_HOST = USE_LOCAL_BACKEND
  ? (process.env.EXPO_PUBLIC_API_HOST ??
    (Platform.OS === "android" ? "10.0.2.2" : "localhost"))
  : DEPLOYED_API_BASE_URL;

// EXPO_PUBLIC_API_HOST doubles as either a bare dev-machine host ("10.1.1.211") or a full
// deployed API base URL ("https://xyz.execute-api.ap-southeast-2.amazonaws.com/prod") — a bare
// host still needs the local dev server's scheme/port appended, a full URL is already complete.
export const API_BASE_URL = /^https?:\/\//.test(API_HOST)
  ? API_HOST
  : `http://${API_HOST}:5010`;
