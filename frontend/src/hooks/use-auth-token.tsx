import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { fetchAuthSession } from "aws-amplify/auth";
import { useRouter } from "expo-router";

import { useI18n } from "@/hooks/use-i18n";

export type AuthTokenContextValue = {
  jwtToken: string;
  tokenError: boolean;
};

// Exported so tests can supply a fake token/error state directly via
// `<AuthTokenContext.Provider value={...}>` instead of mocking fetchAuthSession.
export const AuthTokenContext = createContext<AuthTokenContextValue | null>(
  null,
);

/**
 * Fetches the Cognito ID token once per authenticated session and shares it via
 * context, instead of every screen re-fetching it independently in its own effect.
 * Mount this OUTSIDE anything that remounts on its own (e.g. the locale-keyed Stack
 * in app/_layout.tsx) — that's what keeps a language switch from re-triggering this.
 */
export function AuthTokenProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { t } = useI18n();
  // Read via a ref rather than a `t` dependency — this effect must run exactly once
  // per authenticated session, not re-run every time the user switches language.
  const tRef = useRef(t);
  tRef.current = t;

  const [jwtToken, setJwtToken] = useState("");
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const getToken = async () => {
      try {
        const session = await fetchAuthSession();
        // The backend validates the JWT's `aud` claim against the Cognito app client —
        // Cognito's access token has no `aud` at all (only `client_id`), so it always
        // fails that check. The ID token carries both `aud` and `sub`.
        const token = session.tokens?.idToken?.toString();
        if (!token) throw new Error("No access token found");
        if (!cancelled) setJwtToken(token);
      } catch (err) {
        console.error("Error fetching JWT:", err);
        if (!cancelled) {
          setTokenError(true);
          Alert.alert(
            tRef.current("common.error"),
            tRef.current("common.authError"),
          );
        }
        router.push({ pathname: "/login" });
      }
    };
    getToken();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthTokenContext.Provider value={{ jwtToken, tokenError }}>
      {children}
    </AuthTokenContext.Provider>
  );
}

export function useAuthToken() {
  const ctx = useContext(AuthTokenContext);
  if (!ctx)
    throw new Error("useAuthToken must be used inside AuthTokenProvider");
  return ctx;
}
