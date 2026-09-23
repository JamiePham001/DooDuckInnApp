/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: ["<rootDir>/jest.setup.js"],
  // Strips the ".native" extension resolution react-native-worklets otherwise
  // requires — without it, importing anything that touches reanimated/worklets
  // fails to resolve under Jest's node environment.
  resolver: "react-native-worklets/jest/resolver.js",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-css-interop|uuid|@aws-amplify/.*|aws-amplify)",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
  // theme.ts imports global.css for web's CSS custom properties — Metro-only syntax
  // that Jest's Node transform can't parse. It's inert on native/test anyway.
  moduleNameMapper: {
    "\\.css$": "<rootDir>/src/test-utils/style-mock.js",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/**/_layout.tsx",
  ],
};
