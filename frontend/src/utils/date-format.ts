import { EDayOfWeek, EMonth } from '@shared/enums';

/**
 * Format date with timezone
 */
export const formatDate = (date: Date | string, timezone?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(dateObj);
};

/**
 * Format time with timezone
 */
export const formatTime = (date: Date | string, timezone?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(dateObj);
};

/**
 * Format date and time with timezone
 */
export const formatDateTime = (date: Date | string, timezone?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(dateObj);
};

/**
 * Format time from HH:mm string (e.g., "09:00")
 */
export const formatTimeOfDay = (timeOfDay: string | undefined, timezone?: string): string => {
  if (!timeOfDay) return '00:00';
  
  // Create date with time
  const [hours, minutes] = timeOfDay.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date);
};

/**
 * Format interval display
 */
export const formatInterval = (intervalValue?: number, intervalUnit?: string): string => {
  if (!intervalValue) return 'Once';
  
  const unit = intervalUnit || 'minutes';
  return `Every ${intervalValue} ${unit}`;
};

/**
 * Get relative time (e.g., "in 2 hours", "2 days ago")
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const diffMs = dateObj.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (Math.abs(diffMinutes) < 60) {
    return diffMinutes > 0 
      ? `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`
      : `${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) !== 1 ? 's' : ''} ago`;
  }
  
  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 
      ? `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`
      : `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`;
  }
  
  return diffDays > 0 
    ? `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`
    : `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
};

/**
 * Format schedule next run display
 */
export const formatNextRun = (
  nextRunDate: Date | string,
  timeOfDay?: string,
  timezone?: string
): string => {
  const date = formatDate(nextRunDate, timezone);
  const time = formatTimeOfDay(timeOfDay, timezone);
  const relative = getRelativeTime(nextRunDate);
  
  return `${date} at ${time} (${relative})`;
};

/**
 * Get day of week name from EDayOfWeek enum
 */
export const getDayOfWeekName = (day: number): string => {
  const dayNames = Object.entries(EDayOfWeek)
    .filter(([_, value]) => typeof value === 'number')
    .reduce((acc, [key, value]) => {
      acc[value as number] = key.charAt(0) + key.slice(1).toLowerCase();
      return acc;
    }, {} as Record<number, string>);
  
  return dayNames[day] || 'Unknown';
};

/**
 * Get month name from EMonth enum
 */
export const getMonthName = (month: number): string => {
  const monthNames = Object.entries(EMonth)
    .filter(([_, value]) => typeof value === 'number')
    .reduce((acc, [enumKey, value]) => {
      acc[value as number] = enumKey.charAt(0) + enumKey.slice(1).toLowerCase();
      return acc;
    }, {} as Record<number, string>);
  
  return monthNames[month] || 'Unknown';
};

/**
 * Format execution count with percentage
 */
export const formatExecutionStats = (
  successCount: number,
  totalCount: number
): string => {
  if (totalCount === 0) return '0/0 (0%)';
  
  const percentage = ((successCount / totalCount) * 100).toFixed(1);
  return `${successCount}/${totalCount} (${percentage}%)`;
};

