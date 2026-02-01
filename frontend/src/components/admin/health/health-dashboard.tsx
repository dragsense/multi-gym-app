import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/layout-ui/app-card';
import {
  Activity,
  Database,
  HardDrive,
  Wifi,
  Server,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useId, useMemo, useTransition } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { buildSentence } from '@/locales/translations';
import { useShallow } from 'zustand/shallow';
import type { IHealthStatus } from '@shared/interfaces/health.interface';
import { type TSingleHandlerStore } from '@/stores';
import { type THandlerComponentProps } from '@/@types/handler-types';

export type THealthDashboardExtraProps = {
  refetch: () => void;
}

interface IHealthDashboardProps extends THandlerComponentProps<TSingleHandlerStore<IHealthStatus, THealthDashboardExtraProps>> {
}

export const HealthDashboard = ({ storeKey, store }: IHealthDashboardProps) => {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

  // Language support
  const { t } = useI18n();

  if (!store) {
    return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
  }

  const { response: data, isLoading, error, extra } = store(useShallow(state => ({
    response: state.response,
    isLoading: state.isLoading,
    error: state.error,
    extra: state.extra,
  })));


  const { refetch } = extra;

  // React 19: Smooth refresh
  const handleRefresh = () => {
    startTransition(() => {
      refetch();
    });
  };


  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
      <Activity className="h-8 w-8 animate-spin" />
      <span className="ml-2">{buildSentence(t, 'loading', 'health', 'status')}</span>
    </div>;
  }

  if (error) {
    return <div className="text-center py-8">
      <p className="text-red-500 mb-4">{buildSentence(t, 'error', 'loading', 'health', 'status')} : {error.message}</p>
      <Button onClick={() => refetch()} variant="outline">
        {buildSentence(t, 'try', 'again')}
      </Button>
    </div>;
  }


  if (!data) {
    return <div className="flex items-center justify-center h-64">
      <p className="text-gray-500">{buildSentence(t, 'no', 'health', 'data', 'available')}</p>
    </div>;
  }

  const { status, checks, uptime, version, environment } = data;
  const { database, memory, network } = checks;



  // Status icon and color
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6" data-component-id={componentId}>
      {/* Overall Status */}
      <AppCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status)}
            <div>
              <h3 className="text-lg font-semibold">{buildSentence(t, 'system', 'health')}</h3>
              <p className={`text-sm font-medium ${getStatusColor(status)}`}>
                {status === 'healthy' ? t('healthy') : status === 'degraded' ? t('degraded') : t('unhealthy')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{buildSentence(t, 'uptime')}: {Math.floor(uptime / 1000 / 60 / 60)}h</p>
            <p className="text-sm text-gray-600">v{version} ({environment})</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </Button>
        </div>
      </AppCard>

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Database Health */}
        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              <span className="font-medium">{t('database')}</span>
            </div>
            {getStatusIcon(database.status)}
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'mode')}:</span>
              <span className="ml-2 font-medium">{database.mode}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'response')}:</span>
              <span className="ml-2 font-medium">{database.responseTime}ms</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'connections')}:</span>
              <span className="ml-2 font-medium">{database.connectionsCount}</span>
            </div>
          </div>
        </AppCard>

        {/* Memory Health */}
        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              <span className="font-medium">{t('memory')}</span>
            </div>
            {getStatusIcon(memory.status)}
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'usage')}:</span>
              <span className="ml-2 font-medium">{memory.percentage.toFixed(1)}%</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'used')}:</span>
              <span className="ml-2 font-medium">{(memory.used / 1024 / 1024).toFixed(1)}MB</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'free')}:</span>
              <span className="ml-2 font-medium">{(memory.free / 1024 / 1024).toFixed(1)}MB</span>
            </div>
          </div>
        </AppCard>


        {/* Network Health */}
        <AppCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Wifi className="h-5 w-5 mr-2" />
              <span className="font-medium">{t('network')}</span>
            </div>
            {getStatusIcon(network.status)}
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'latency')}:</span>
              <span className="ml-2 font-medium">{network.latency}ms</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'throughput')}:</span>
              <span className="ml-2 font-medium">{network.throughput}Mbps</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">{buildSentence(t, 'connections')}:</span>
              <span className="ml-2 font-medium">{network.connections}</span>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  );
};
