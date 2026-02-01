import { Suspense } from "react";
import { AppRouteLoadingFallback } from "@/components/layout-ui/app-route-loading-fallback";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

/**
 * Creates a route element with loading fallback
 * @param Component - The lazy-loaded component to render
 * @param userLevel - The user level or context (default: "App")
 * @param message - Custom loading message (optional) - can be a translation key or array of keys for buildSentence
 * @returns React element with Suspense and loading fallback
 */
export function createRouteElement(
    Component: React.LazyExoticComponent<React.ComponentType<Record<string, never>>>,
    userLevel: string,
    message?: string | string[]
) {
    const RouteElement = () => {
        const { t } = useI18n();
        let defaultMessage: string;

        if (message) {
            if (Array.isArray(message)) {
                defaultMessage = buildSentence(t, ...message);
            } else {
                // Check if it's a translation key (single word) or use as-is
                defaultMessage = message.includes(' ') ? message : buildSentence(t, 'loading', message);
            }
        } else {
            defaultMessage = buildSentence(t, 'loading', userLevel.toLowerCase(), 'page');
        }

        return (
            <Suspense fallback={<AppRouteLoadingFallback title={userLevel} message={defaultMessage} />}>
                <Component />
            </Suspense>
        );
    };

    return <RouteElement />;
}
