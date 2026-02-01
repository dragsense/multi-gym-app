import {
  type SupportedLanguage,
  type LanguageDirection,
  supportedLanguages,
} from "@/config/i18n.config";

export interface I18nContextType {
  language: SupportedLanguage;
  direction: LanguageDirection;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  supportedLanguages: typeof supportedLanguages;
}

export interface I18nProviderProps {
  children: React.ReactNode;
}
