import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type SupportedLanguage, getLanguageDirection } from '@/config/i18n.config';
import { type I18nContextType, type I18nProviderProps } from '@/@types/i18n.types';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: I18nProviderProps) {
    const { i18n, t } = useTranslation();
    const [language, setLanguage] = useState<SupportedLanguage>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('i18nextLng') as SupportedLanguage) || 'en';
        }
        return 'en';
    });

    const direction = useMemo(() => getLanguageDirection(language), [language]);

    useEffect(() => {
        i18n.changeLanguage(language);
        localStorage.setItem('i18nextLng', language);

        // Set document direction
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('dir', direction);
            document.documentElement.setAttribute('lang', language);
        }
    }, [language, direction, i18n]);

    const value = useMemo(() => ({
        language,
        direction,
        setLanguage,
        t,
        supportedLanguages,
    }), [language, direction, t]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
