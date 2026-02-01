import { AppCard } from "@/components/layout-ui/app-card"

// Types
import { type ICombinedDashboardData } from "@shared/interfaces/dashboard.interface"
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

import { type IExtraProps } from "./dashboard-view"
import type { TSingleHandlerStore } from "@/stores"


interface CompactDashboardProps {
    store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>
}


export default function CompactDashboard({ store }: CompactDashboardProps) {
    const { t } = useI18n();

    const isLoading = store((state) => state.isLoading)
    const data = store((state) => state.response)
    const error = store((state) => state.error)



    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <AppCard key={i}>
                        <div className="p-4">
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-6 bg-gray-200 rounded w-1/2" />
                                <div className="h-3 bg-gray-200 rounded w-full" />
                            </div>
                        </div>
                    </AppCard>
                ))}
            </div>
        )
    }



    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">{t('error')}: {error.message}</p>
            </div>
        );
    }

    if (!data) {
        return <div>{buildSentence(t, 'no', 'dashboard', 'data', 'available')}</div>;
    }

    return (
        <AppCard>
            <div className="py-16 px-6 text-center space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {t('comingSoonLabel')}
                </p>
                <h3 className="text-2xl font-semibold">
                    {t('dashboardComingSoon')}
                </h3>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                    {buildSentence(t, 'we', 'are', 'preparing', 'new', 'dashboard', 'analytics')}
                </p>
            </div>
        </AppCard>
    )
}
