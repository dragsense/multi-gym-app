import { useId } from "react";
import { AppLoader } from "./app-loader";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface AppRouteLoadingFallbackProps {
    title?: string;
    message?: string;
}

export function AppRouteLoadingFallback({
    title,
    message
}: AppRouteLoadingFallbackProps = {}) {
    const componentId = useId();
    const { t } = useI18n();

    const defaultTitle = t('app');
    const defaultMessage = buildSentence(t, 'initializing', 'application', 'components');

    return (
        <div className="absolute top-0 left-0 w-full h-full" data-component-id={componentId}>
            <AppLoader>
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{title || defaultTitle}</h3>
                    <p className="text-sm text-muted-foreground">{message || defaultMessage}</p>
                </div>
            </AppLoader>
        </div>
    );
}