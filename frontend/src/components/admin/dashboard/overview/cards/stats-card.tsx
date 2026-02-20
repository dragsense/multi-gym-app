import React from 'react';
import { AppCard } from '@/components/layout-ui/app-card';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface IStatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: number;
  loading?: boolean;
}

export const StatsCard: React.FC<IStatsCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  change,
  loading = false
}) => {
  const header = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  );

  const content = (
    <div className="flex items-center gap-2">
      <h3 className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
      {change !== undefined && (
        <div className={`flex items-center text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
          {Math.abs(change)}%
        </div>
      )}
    </div>
  );

  return (
    <AppCard
      header={header}
      loading={loading}
      className="hover:shadow-md transition-shadow"
    >
      {content}
    </AppCard>
  );
};
