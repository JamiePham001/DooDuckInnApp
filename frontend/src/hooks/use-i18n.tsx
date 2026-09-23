import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { i18n, initI18n, persistLocale, type Locale } from "@/i18n";

type I18nContextValue = {
  locale: Locale;
  t: typeof i18n.t;
  setLocale: (locale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * i18n-js mutates a plain `i18n.locale` property, which doesn't trigger a React
 * re-render on its own — this Provider is what makes switching languages actually
 * update every screen: `setLocale` writes through to i18n-js/AsyncStorage and mirrors
 * the value into React state, so every t() call downstream re-runs against it.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(i18n.locale as Locale);

  useEffect(() => {
    initI18n().then(() => setLocaleState(i18n.locale as Locale));
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: i18n.t.bind(i18n),
      setLocale: async (next) => {
        await persistLocale(next);
        setLocaleState(next);
      },
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
