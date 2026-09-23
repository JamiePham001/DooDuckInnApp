import { Platform } from "react-native";

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
export const API_HOST =
  process.env.EXPO_PUBLIC_API_HOST ?? (Platform.OS === "android" ? "10.0.2.2" : "localhost");
