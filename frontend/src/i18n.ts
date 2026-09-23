import { I18n } from "i18n-js";
import * as Localization from "react-native-localize";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import vi from "./locales/vi.json";

// Display names are shown in each language's own script (e.g. "Tiếng Việt", not its
// English translation) — that's the convention every OS language picker follows.
export const LOCALES = { en: "English", vi: "Tiếng Việt" } as const;
export type Locale = keyof typeof LOCALES;

const STORAGE_KEY = "user-lang";

export const i18n = new I18n({ en, vi });
i18n.enableFallback = true;
i18n.defaultLocale = "en";

function isLocale(value: string | null | undefined): value is Locale {
  return !!value && value in LOCALES;
}

// Restores a saved preference, or the device's language if it's one we support, or
// English otherwise. Call once before the app renders translated text.
export async function initI18n(): Promise<void> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (isLocale(saved)) {
    i18n.locale = saved;
    return;
  }

  const best = Localization.findBestLanguageTag(Object.keys(LOCALES) as Locale[]);
  i18n.locale = isLocale(best?.languageTag) ? best.languageTag : "en";
}

export async function persistLocale(locale: Locale): Promise<void> {
  i18n.locale = locale;
  await AsyncStorage.setItem(STORAGE_KEY, locale);
}
