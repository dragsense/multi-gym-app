import React from 'react';
import { useShallow } from 'zustand/shallow';
import CompactDashboard from './compact-dashboard';
import type { TSingleHandlerStore } from '@/stores';
import type { DateRange } from 'react-day-picker';
import type { ICombinedDashboardData } from '@/@types/dashboard.type';

export interface IExtraProps {
  dateRange?: DateRange;
}

interface IDashboardViewProps {
  storeKey: string;
  store: TSingleHandlerStore<ICombinedDashboardData, IExtraProps>;
}

export const DashboardView: React.FC<IDashboardViewProps> = ({ storeKey, store }) => {
  // Optimized store selector with useShallow - only re-renders when these specific values change
  const { isLoading, data, error, } = store(
    useShallow((state) => ({
      isLoading: state.isLoading,
      data: state.response,
      error: state.error,
    }))
  );

  // ERROR STATE
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
        Error loading dashboard data: {error.message}
      </div>
    );
  }




  return (
    <div className="space-y-6">
        <CompactDashboard data={data} error={error} isLoading={isLoading} />
    </div>
  );
};

export default DashboardView;