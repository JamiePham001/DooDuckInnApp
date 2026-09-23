import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "react-native-localize";

jest.mock("react-native-localize", () => ({
  findBestLanguageTag: jest.fn(),
}));

// Imported after the mocks above are registered, and inside each test via
// `jest.isolateModules` where the module's own `i18n.locale` state needs to
// start fresh — the module holds a singleton `I18n` instance.
import { i18n, initI18n, persistLocale, LOCALES } from "../i18n";

const findBestLanguageTag = Localization.findBestLanguageTag as jest.Mock;

describe("i18n", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    findBestLanguageTag.mockReset();
  });

  describe("LOCALES", () => {
    it("exposes English and Vietnamese, named in their own script", () => {
      expect(LOCALES).toEqual({ en: "English", vi: "Tiếng Việt" });
    });
  });

  describe("initI18n", () => {
    it("restores a previously saved locale over the device language", async () => {
      await AsyncStorage.setItem("user-lang", "vi");
      findBestLanguageTag.mockReturnValue({ languageTag: "en", isRTL: false });

      await initI18n();

      expect(i18n.locale).toBe("vi");
    });

    it("falls back to the device's best-matching supported language when nothing is saved", async () => {
      findBestLanguageTag.mockReturnValue({ languageTag: "vi", isRTL: false });

      await initI18n();

      expect(i18n.locale).toBe("vi");
      expect(findBestLanguageTag).toHaveBeenCalledWith(["en", "vi"]);
    });

    it("defaults to English when the device language isn't supported", async () => {
      findBestLanguageTag.mockReturnValue(undefined);

      await initI18n();

      expect(i18n.locale).toBe("en");
    });

    it("ignores a corrupted/unsupported stored value rather than crashing", async () => {
      await AsyncStorage.setItem("user-lang", "fr");
      findBestLanguageTag.mockReturnValue({ languageTag: "en", isRTL: false });

      await initI18n();

      expect(i18n.locale).toBe("en");
    });
  });

  describe("persistLocale", () => {
    it("updates the active locale immediately", async () => {
      await persistLocale("vi");
      expect(i18n.locale).toBe("vi");
    });

    it("writes the choice to storage so it survives a restart", async () => {
      await persistLocale("vi");
      expect(await AsyncStorage.getItem("user-lang")).toBe("vi");
    });
  });

  describe("translation", () => {
    it("translates a known key in the active locale", async () => {
      await persistLocale("en");
      expect(i18n.t("common.cancel")).toBe("Cancel");

      await persistLocale("vi");
      expect(i18n.t("common.cancel")).toBe("Hủy");
    });

    it("pluralizes English email counts correctly", async () => {
      await persistLocale("en");
      expect(i18n.t("home.emailCount", { count: 1 })).toBe("1 email");
      expect(i18n.t("home.emailCount", { count: 3 })).toBe("3 emails");
    });
  });
});
