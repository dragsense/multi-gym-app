import { useI18n } from '@/hooks/use-i18n';
import { AppSelect } from './layout-ui/app-select';
import type { SupportedLanguage } from '@/config/i18n.config';

export function LanguageSwitcher() {
    const { language, setLanguage, supportedLanguages } = useI18n();

    return (
        <div className="flex items-center gap-2">
            <AppSelect
                value={language}
                clearable={false}
                onChange={(value) => setLanguage(value as SupportedLanguage)}
                options={supportedLanguages.map((lang) => ({
                    label: lang.name,
                    value: lang.code,
                }))}
            />
        </div>
    );
}
