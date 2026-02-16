import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AppCard } from '@/components/layout-ui/app-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import type { IBillingAnalytics } from '@shared/interfaces/dashboard.interface';
import { useUserSettings } from '@/hooks/use-user-settings';
import { useI18n } from '@/hooks/use-i18n';
import { buildSentence } from '@/locales/translations';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface IBillingOverviewProps {
  data: IBillingAnalytics | null;
  loading?: boolean;
  isSuperAdmin?: boolean;
  dynamicDateLabel?: string;
}

export const BillingOverview = ({
  data: analyticsData,
  isSuperAdmin = false,
  loading = false,
  dynamicDateLabel,
}: IBillingOverviewProps) => {
  const { settings } = useUserSettings();
  const { t } = useI18n();

  if (!analyticsData) return <div className="p-4 text-center">{buildSentence(t, 'no', 'billing', 'data', 'available')}</div>;

  const currencyFormatter = (value: number) => formatCurrency(value, undefined, undefined, 2, 2, settings)

  if (loading) {
    return <div className="p-4 text-center">{buildSentence(t, 'loading', 'billing', 'data')}...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AppCard
        header={
          <div>
            <h2 className="text-md font-semibold tracking-tight">{buildSentence(t, 'billing', 'analytics')}</h2>
            <p className="text-muted-foreground text-sm">{isSuperAdmin ? t('platform') : t('your')} {dynamicDateLabel}</p>
          </div>

        }
      >
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 gap-2">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="revenue">{t('revenue')}</TabsTrigger>
            <TabsTrigger value="breakdown">{t('breakdown')}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-2">

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <AppCard
                header={<span className="text-sm font-medium text-secondary">{buildSentence(t, 'total', 'billings')}</span>}
                footer={`${analyticsData.summary?.total_billings || 0} ${t('invoices')}`}
              >
                <div className="text-2xl font-bold text-secondary">{formatCurrency(analyticsData.revenue.total / 100, undefined, undefined, 2, 2, settings)}</div>
              </AppCard>

              <AppCard
                header={<span className="text-sm font-medium text-green-600">{t('paid')}</span>}
                footer={`${analyticsData.summary?.paid_billings || 0} ${t('completed')}`}
              >
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency((analyticsData.summary?.total_paid || 0) / 100, undefined, undefined, 2, 2, settings)}
                </div>
              </AppCard>

              <AppCard
                header={<span className="text-sm font-medium text-yellow-600">{t('pending')}</span>}
                footer={`${analyticsData.summary?.pending_billings || 0} ${t('awaiting')}`}
              >
                <div className="text-2xl font-bold text-yellow-700">
                  {formatCurrency((analyticsData.summary?.total_pending || 0) / 100, undefined, undefined, 2, 2, settings)}
                </div>
              </AppCard>

              {analyticsData.summary && (
                <AppCard
                  header={<span className="text-sm font-medium text-red-600">{t('overdue')}</span>}
                  footer={`${analyticsData.summary.overdue_billings || 0} ${t('late')}`}
                >
                  <div className="text-2xl font-bold text-red-700">
                    {formatCurrency((analyticsData.summary.total_overdue || 0) / 100, undefined, undefined, 2, 2, settings)}
                  </div>
                </AppCard>
              )}

            </div>

            {analyticsData.summary && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>{buildSentence(t, 'payment', 'success', 'rate')}</span>
                  <span className="font-medium">
                    {analyticsData.summary.total_billings > 0
                      ? ((analyticsData.summary.paid_billings / analyticsData.summary.total_billings) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    analyticsData.summary.total_billings > 0
                      ? (analyticsData.summary.paid_billings / analyticsData.summary.total_billings) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            )}

          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AppCard
                header={<span className="text-sm font-medium">{buildSentence(t, 'total', 'revenue')}</span>}
                footer={`${analyticsData.revenue.transactions} ${t('transactions')}`}
              >
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.total / 100, undefined, undefined, 2, 2, settings)}</div>
              </AppCard>

              <AppCard
                header={<span className="text-sm font-medium">{buildSentence(t, 'paid', 'revenue')}</span>}
                footer={`${analyticsData.summary?.paid_billings || 0} ${t('payments')}`}
              >
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.paid / 100, undefined, undefined, 2, 2, settings)}</div>
              </AppCard>

              <AppCard
                header={<span className="text-sm font-medium">{buildSentence(t, 'pending', 'revenue')}</span>}
                footer={`${analyticsData.summary?.pending_billings || 0} ${t('pending')}`}
              >
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.pending / 100, undefined, undefined, 2, 2, settings)}</div>
              </AppCard>

              {isSuperAdmin ? (
                <AppCard
                  header={<span className="text-sm font-medium">{buildSentence(t, 'platform', 'revenue')}</span>}
                >
                  <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.platform / 100, undefined, undefined, 2, 2, settings)}</div>
                </AppCard>
              ) : (
                <AppCard
                  header={<span className="text-sm font-medium">{buildSentence(t, 'your', 'earnings')}</span>}
                  footer={buildSentence(t, 'after', 'platform', 'fees')}
                >
                  <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.trainer / 100, undefined, undefined, 2, 2, settings)}</div>
                </AppCard>
              )}
            </div>


            <AppCard
              header={<span className="text-sm font-medium">{buildSentence(t, 'revenue', 'timeline')}</span>}
              footer={buildSentence(t, 'current', 'month', 'revenue', 'status')}
            >
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis tickFormatter={currencyFormatter} />
                    <Tooltip formatter={currencyFormatter} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#0088FE" name={buildSentence(t, 'total', 'revenue')} strokeWidth={3} />
                    <Line type="monotone" dataKey="paid" stroke="#00C49F" name={buildSentence(t, 'paid', 'revenue')} strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AppCard>

          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <AppCard
                header={<span className="text-sm font-medium">{buildSentence(t, 'revenue', 'by', 'type')}</span>}
              >
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(analyticsData.typeDistribution || []).map(item => ({
                          ...item,
                          total_amount: Number(item.total_amount / 100),
                          paid_amount: Number(item.paid_amount / 100),
                          average_amount: Number(item.average_amount / 100),
                          count: Number(item.count)
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="total_amount"
                        nameKey="type"
                      >
                        {(analyticsData.typeDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `Type: ${props.payload.type}`,
                        ]}
                      />
                      <Legend
                        formatter={(value: string) => (
                          <span className="text-sm text-muted-foreground">
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>


              </AppCard>


            </div>

            {analyticsData.summary && (
              <AppCard
                header={<span className="text-sm font-medium">{buildSentence(t, 'performance', 'metrics')}</span>}
                footer={buildSentence(t, 'key', 'billing', 'indicators')}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'avg', 'billing')}</span>
                    <div className="text-xl font-semibold">
                      {formatCurrency((analyticsData.summary.average_billing_amount || 0) / 100, undefined, undefined, 2, 2, settings)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'avg', 'paid')}</span>
                    <div className="text-xl font-semibold">
                      {formatCurrency((analyticsData.summary.average_paid_amount || 0) / 100, undefined, undefined, 2, 2, settings)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'success', 'rate')}</span>
                    <div className="text-xl font-semibold">
                      {analyticsData.summary.total_billings > 0
                        ? ((analyticsData.summary.paid_billings / analyticsData.summary.total_billings) * 100).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">{buildSentence(t, 'pending', 'rate')}</span>
                    <div className="text-xl font-semibold">
                      {analyticsData.summary.total_billings > 0
                        ? ((analyticsData.summary.pending_billings / analyticsData.summary.total_billings) * 100).toFixed(
                          1,
                        )
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </AppCard>
            )}
          </TabsContent>
        </Tabs>
      </AppCard>
    </div>
  )
}


