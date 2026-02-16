/**
 * Locale configuration mapping language codes to Intl locales
 * This allows easy extension for additional languages
 */
export const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  // Add more languages as needed
  // es: "es-ES",
  // fr: "fr-FR",
  // etc.
};

/**
 * Get locale for a given language code
 * @param langCode Language code (e.g., 'en', 'ar')
 * @returns Intl locale string (e.g., 'en-US', 'ar-AE')
 */
export function getLocaleForLanguage(
  langCode: string | null | undefined
): string {
  if (!langCode) return LOCALE_MAP.en || "en-US";
  return LOCALE_MAP[langCode] || LOCALE_MAP.en || "en-US";
}

/**
 * Get current locale from localStorage or default
 * @returns Current locale string
 */
export function getCurrentLocale(): string {
  if (typeof window === "undefined") return LOCALE_MAP.en || "en-US";
  const currentLang = localStorage.getItem("i18nextLng") || "en";
  return getLocaleForLanguage(currentLang);
}
