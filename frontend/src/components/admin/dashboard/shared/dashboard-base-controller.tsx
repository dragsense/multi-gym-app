import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared-ui/date-picker';
import { RefreshCw, Download } from 'lucide-react';

interface IDashboardBaseControllerProps {
  period: 'day' | 'week' | 'month' | 'year';
  customDate: string;
  onPeriodChange: (period: 'day' | 'week' | 'month' | 'year') => void;
  onCustomDateChange: (date: string) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  showExport?: boolean;
  showRefresh?: boolean;
  children?: React.ReactNode; // For additional controls
}

export const DashboardBaseController: React.FC<IDashboardBaseControllerProps> = ({
  period,
  customDate,
  onPeriodChange,
  onCustomDateChange,
  onRefresh,
  onExport,
  showExport = false,
  showRefresh = true,
  children
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {/* Period Selector */}
      <Select value={period} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Daily</SelectItem>
          <SelectItem value="week">Weekly</SelectItem>
          <SelectItem value="month">Monthly</SelectItem>
          <SelectItem value="year">Yearly</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Custom Date Picker */}
      <DatePicker
        value={customDate ? new Date(customDate) : undefined}
        onSelect={(date) => onCustomDateChange(date ? date.toLocaleString().split('T')[0] : '')}
        placeholder="Custom date"
      />
      
      {/* Additional controls passed as children */}
      {children}
      
      {/* Action buttons */}
      {showRefresh && onRefresh && (
        <Button onClick={onRefresh} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
      
      {showExport && onExport && (
        <Button onClick={onExport} size="sm" variant="outline">
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
