/**
 * Web has no native splash screen to hand off from, so there is nothing to cover or hide —
 * the overlay is a no-op here. Signature must match the native file in animated-icon.tsx.
 */
export function AnimatedSplashOverlay(_props: { ready: boolean }) {
  return null;
}
