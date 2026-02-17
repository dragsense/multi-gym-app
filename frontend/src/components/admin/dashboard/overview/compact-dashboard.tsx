import type React from "react"

import { Badge } from "@/components/ui/badge"
import {
    Users,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    AlertTriangle,
    Hourglass,
    CreditCard,
    Clock,
    Calendar,
} from "lucide-react"
import { AppCard } from "@/components/layout-ui/app-card"

// Types
import type { ICombinedDashboardData } from "@/@types/dashboard.type"
import { BillingOverview } from "./cards/billing-overview"
import { useAuthUser } from "@/hooks/use-auth-user"
import { EUserLevels } from "@shared/enums"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"
import { buildSentence } from "@/locales/translations"
import { SessionsAnalyticsCard } from "./cards/session-analytics-card"

interface CompactDashboardProps {
    data?: ICombinedDashboardData | null
    isLoading: boolean,
    error?: Error | null
}

// Compact metric display
function MetricRow({
    icon,
    label,
    value,
    change,
    trend,
    secondary,
}: {
    icon: React.ReactNode
    label: string
    value: string | number
    change?: string
    trend?: "up" | "down" | "neutral"
    secondary?: string
}) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-b-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0">{icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{label}</p>
                    {secondary && <p className="text-xs">{secondary}</p>}
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold">{value}</span>
                {change && (
                    <Badge
                        variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"}
                        className="text-xs px-1 py-0"
                    >
                        {trend === "up" && <TrendingUp className="h-3 w-3" />}
                        {trend === "down" && <TrendingDown className="h-3 w-3" />}
                        {change}
                    </Badge>
                )}
            </div>
        </div>
    )
}

// Ultra-compact KPI card
function KPICard({
    title,
    metrics,
    alert,
}: {
    title: string
    metrics: Array<{
        label: string
        value: string | number
        status?: "good" | "warning" | "danger"
        icon?: React.ReactNode
    }>
    alert?: string
}) {
    return (
        <AppCard>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                {title}
                {alert && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            </h3>
            <div className="space-y-2">
                {metrics.map((metric, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {metric.icon && <span className="">{metric.icon}</span>}
                            <span className="text-xs">{metric.label}</span>
                        </div>
                        <span
                            className={`text-sm font-bold ${metric.status === "good"
                                ? "text-green-600"
                                : metric.status === "warning"
                                    ? "text-amber-600"
                                    : metric.status === "danger"
                                        ? "text-red-600"
                                        : "text-gray-900"
                                }`}
                        >
                            {metric.value}
                        </span>
                    </div>
                ))}
            </div>
            {alert && (
                <div className="mt-3 p-2 bg-amber-50 rounded text-xs text-amber-700 border-l-2 border-amber-200">{alert}</div>
            )}
        </AppCard>
    )
}

const ClientDashboardPlaceholder = () => {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <AppCard
                header={
                    <div className="flex items-center gap-3">
                        <Hourglass className="w-6 h-6 text-muted-foreground" />
                        <h2 className="text-xl font-semibold">Client Dashboard</h2>
                    </div>
                }
                footer={
                    <Button onClick={() => window.location.reload()}>
                        Refresh when ready
                    </Button>
                }
                className="max-w-md w-full text-center"
            >
                <p className="text-muted-foreground mb-3">
                    Your client dashboard is under construction and will be available soon.
                </p>
                <p className="text-sm text-muted-foreground">
                    We're working on bringing you insights, schedules, and progress tracking right here.
                    Check back later for updates!
                </p>
            </AppCard>
        </div>
    );
};

export default function CompactDashboard({ data, error, isLoading }: CompactDashboardProps) {
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
    const { t } = useI18n();
    const { user } = useAuthUser();

    if (user?.level === EUserLevels.MEMBER) {
        return <ClientDashboardPlaceholder />
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <p className="text-red-500 mb-4">Error: {error.message}</p>
            </div>
        );
    }

    if (!data) {
        return <div>No dashboard data available</div>;
    }

    const { stats, billingAnalytics, sessionsAnalytics } = data;
    const { overview, metrics } = stats;

    // Calculate derived metrics
    const activeMemberRate =
        overview.totalMembers > 0 ? ((overview.totalActiveMembers / overview.totalMembers) * 100).toFixed(1) : "0"

    const activeStaffRate =
        overview.totalStaff > 0 ? ((overview.totalActiveStaff / overview.totalStaff) * 100).toFixed(1) : "0"

    const completedSessionsRate =
        overview.totalCompletedSessions > 0 ? ((overview.totalCompletedSessions / overview.totalSessions) * 100).toFixed(1) : "0"

    const billingPendingRate =
        overview.totalBillings > 0 ? ((overview.pendingBillings / overview.totalBillings) * 100).toFixed(1) : "0"

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2">
                <div className="space-y-2">
                    <AppCard
                        className="gap-2"
                        header={
                            <div>
                                <h2 className="font-semibold text-md">{t('summary')}</h2>
                            </div>
                        }
                    >
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2`}>





                            {/* Super Admin/Admin/Trainer: Total Members */}
                            {overview.totalMembers !== undefined && (
                                <AppCard
                                    className="flex-1 gap-2 bg-[#DCFCE7] text-black/80 shadow-2xl"
                                    header={
                                        <span className="text-sm font-medium">
                                            {buildSentence(t, 'total', 'members')}
                                        </span>
                                    }
                                    footer={
                                        <p className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'active')} {overview.totalActiveMembers || 0}/{overview.totalMembers}
                                        </p>
                                    }
                                >
                                    <div className="space-y-2">
                                        <Users className="h-8 w-8" />
                                        <div className="text-2xl font-bold">{overview.totalMembers}</div>
                                    </div>
                                </AppCard>
                            )}

                            {/* Staff: Total Staff */}
                            {overview.totalStaff !== undefined && (
                                <AppCard
                                    className="flex-1 gap-2 bg-[#B3EDFF] text-black/80 shadow-2xl"
                                    header={
                                        <span className="text-sm font-medium">
                                            {buildSentence(t, 'total', 'staff')}
                                        </span>
                                    }
                                    footer={
                                        <p className="text-xs text-muted-foreground">
                                            {buildSentence(t, 'active')} {overview.totalActiveStaff}%
                                        </p>
                                    }
                                >
                                    <div className="space-y-2">
                                        <Users className="h-8 w-8" />
                                        <div className="text-2xl font-bold">{overview.totalStaff}</div>
                                    </div>
                                </AppCard>
                            )}

                            {/* Sessions: Total Sessions */}
                            {overview.totalSessions !== undefined && (
                                <AppCard
                                    className="flex-1 gap-2 bg-yellow-50 text-black/80 shadow-2xl"
                                    header={
                                        <span className="text-sm font-medium">
                                            {buildSentence(t, 'total', 'sessions')}
                                        </span>
                                    }
                                    footer={
                                        <p className="text-xs text-muted-foreground">
                                            {completedSessionsRate}%
                                        </p>
                                    }
                                >
                                    <div className="space-y-2">
                                        <Calendar className="h-8 w-8" />

                                        <div className="text-2xl font-bold">{overview.totalSessions}</div>
                                    </div>
                                </AppCard>
                            )}


                            {/* Super Admin/Admin/Client: Total Billings */}
                            {overview.totalBillings !== undefined && (
                                <AppCard
                                    className="flex-1 gap-2 bg-red-50 text-black/80 shadow-2xl"
                                    header={
                                        <span className="text-sm font-medium">
                                            {buildSentence(t, 'total', 'billings')}
                                        </span>
                                    }
                                    footer={
                                        <p className="text-xs text-muted-foreground">
                                            {overview.paidBillings || 0} {t('paid')}, {overview.pendingBillings || 0} {t('pending')}
                                        </p>
                                    }
                                >
                                    <div className="space-y-2">
                                        <CreditCard className="h-8 w-8" />
                                        <div className="text-2xl font-bold">{overview.totalBillings}</div>
                                    </div>
                                </AppCard>
                            )}




                        </div>
                    </AppCard>
                </div>

                <div className="space-y-2">


                    {/*  <AppCard>
                        <h3 className="font-semibold text-sm mb-3">People & Engagement</h3>
                        <div className="space-y-1">
                            <MetricRow
                                icon={<Users className="h-4 w-4" />}
                                label="Members"
                                value={`${overview.totalActiveMembers}/${overview.totalMembers}`}
                                change={`${activeMemberRate}%`}
                                trend={Number.parseFloat(activeMemberRate) > 80 ? "up" : "neutral"}
                            />
                            <MetricRow
                                icon={<Users className="h-4 w-4" />}
                                label="Staff"
                                value={`${overview.totalActiveStaff}/${overview.totalStaff}`}
                                change={`${activeStaffRate}%`}
                                trend={Number.parseFloat(activeStaffRate) > 80 ? "up" : "neutral"}
                            />

                        </div>
                    </AppCard> */}
                    <KPICard
                        title="Performance Overview"
                        metrics={[
                            {
                                label: "Member Engagement",
                                value: `${activeMemberRate}%`,
                                status:
                                    Number.parseFloat(activeMemberRate) > 80
                                        ? "good"
                                        : Number.parseFloat(activeMemberRate) > 60
                                            ? "warning"
                                            : "danger",
                                icon: <Users className="h-3 w-3" />,
                            },
                            {
                                label: "Staff Engagement",
                                value: `${activeStaffRate}%`,
                                status:
                                    Number.parseFloat(activeStaffRate) > 80
                                        ? "good"
                                        : Number.parseFloat(activeStaffRate) > 60
                                            ? "warning"
                                            : "danger",
                                icon: <Users className="h-3 w-3" />,
                            },
                            {
                                label: "Session Completion Rate",
                                value: `${completedSessionsRate}%`,
                                status:
                                    Number.parseFloat(completedSessionsRate) > 80
                                        ? "good"
                                        : Number.parseFloat(completedSessionsRate) > 60
                                            ? "warning"
                                            : "danger",
                                icon: <Calendar className="h-3 w-3" />,
                            },
                            {
                                label: "Avg. Billing",
                                value: formatCurrency((billingAnalytics?.summary?.average_billing_amount || 0) / 100),
                                status: "good",
                                icon: <CreditCard className="h-3 w-3" />,
                            },
                            {
                                label: "Avg. Paid",
                                value: formatCurrency((billingAnalytics?.summary?.average_paid_amount || 0) / 100),
                                status: "good",
                                icon: <CheckCircle className="h-3 w-3" />,
                            },
                            {
                                label: "Billing Success Rate",
                                value: `${billingAnalytics?.summary?.total_billings > 0
                                    ? ((billingAnalytics.summary.paid_billings / billingAnalytics.summary.total_billings) * 100).toFixed(1)
                                    : 0
                                    }%`,
                                status:
                                    billingAnalytics?.summary && billingAnalytics.summary.total_billings > 0 &&
                                        (billingAnalytics.summary.paid_billings / billingAnalytics.summary.total_billings) * 100 > 80
                                        ? "good"
                                        : "warning",
                                icon: <TrendingUp className="h-3 w-3" />,
                            },
                            {
                                label: "Billing Pending Rate",
                                value: `${billingAnalytics?.summary?.total_billings > 0
                                    ? ((billingAnalytics.summary.pending_billings / billingAnalytics.summary.total_billings) * 100).toFixed(1)
                                    : 0
                                    }%`,
                                status:
                                    billingAnalytics?.summary && billingAnalytics.summary.total_billings > 0 &&
                                        (billingAnalytics.summary.pending_billings / billingAnalytics.summary.total_billings) * 100 > 50
                                        ? "danger"
                                        : "warning",
                                icon: <Clock className="h-3 w-3" />,
                            },
                        ]}
                        alert={
                            metrics.paymentSuccessRate === 0 && overview.totalBillings > 0
                                ? "Payment processing needs attention"
                                : Number.parseFloat(billingPendingRate) > 50
                                    ? `${billingPendingRate}% of billings are pending`
                                    : undefined
                        }
                    />
                </div>

            </div>

            <BillingOverview
                data={billingAnalytics}
                loading={isLoading}
            />

            <SessionsAnalyticsCard data={sessionsAnalytics} loading={isLoading} />
        </div>
    );
}