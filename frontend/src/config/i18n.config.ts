import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import en from "../locales/en.json";

export const supportedLanguages = [
  { code: "en", name: "English", flag: "🇺🇸", dir: "ltr" as const },
] as const;

export type LanguageDirection = "ltr" | "rtl";

export const getLanguageDirection = (
  language: SupportedLanguage
): LanguageDirection => {
  const lang = supportedLanguages.find((l) => l.code === language);
  return lang?.dir || "ltr";
};

export type SupportedLanguage = (typeof supportedLanguages)[number]["code"];

export const defaultLanguage: SupportedLanguage = "en";

const resources = {
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
    debug: import.meta.env.DEV,

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    react: {
      useSuspense: false, // Disable suspense for better UX
    },
  });

export default i18n;
