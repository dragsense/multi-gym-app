import { DateTime } from "luxon";
import { EDateFormat, ETimeFormat } from "../enums/user-settings.enum";
import type { IUserSettings } from "../interfaces/settings.interface";

// ==================== Currency Formatting ====================

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  AED: "د.إ",
  PKR: "₨",
  EUR: "€",
  GBP: "£",
};

/**
 * Gets the symbol for a currency code
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Formats a number as currency with proper localization
 */
export function formatCurrency(
  amount: number,
  currency?: string,
  locale?: string,
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2,
  settings?: IUserSettings
): string {
  const currencyCode = currency || settings?.currency?.defaultCurrency || "USD";
  const finalLocale = locale || "en-US";

  return new Intl.NumberFormat(finalLocale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Formats a number as percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Formats a number with optional decimals
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Converts amount to minor units (cents) for payment processing
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Converts amount from minor units (cents) to major units
 */
export function fromMinorUnits(amount: number): number {
  return amount / 100;
}

// ==================== Date/Time Formatting with Luxon ====================

/**
 * Converts EDateFormat enum to Luxon format string
 */
function getDateFormatString(dateFormat?: EDateFormat): string {
  switch (dateFormat) {
    case EDateFormat.MM_DD_YYYY:
      return "MM/dd/yyyy";
    case EDateFormat.DD_MM_YYYY:
      return "dd/MM/yyyy";
    case EDateFormat.YYYY_MM_DD:
      return "yyyy-MM-dd";
    case EDateFormat.DD_MMM_YYYY:
      return "dd MMM yyyy";
    case EDateFormat.MMM_DD_YYYY:
      return "MMM dd, yyyy";
    default:
      return "MMM dd, yyyy";
  }
}

/**
 * Converts ETimeFormat enum to Luxon format string
 */
function getTimeFormatString(timeFormat?: ETimeFormat): string {
  switch (timeFormat) {
    case ETimeFormat.TWENTY_FOUR_HOUR:
      return "HH:mm";
    case ETimeFormat.TWELVE_HOUR:
    default:
      return "hh:mm a";
  }
}

/**
 * Formats a date according to user settings using Luxon
 */
export function formatDate(
  date: Date | string,
  settings?: IUserSettings
): string {
  const dateFormat = settings?.time?.dateFormat || EDateFormat.MMM_DD_YYYY;
  const timeZone =
    settings?.time?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formatString = getDateFormatString(dateFormat);

  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date, { zone: timeZone })
      : DateTime.fromJSDate(date, { zone: timeZone });

  return dt.toFormat(formatString);
}

/**
 * Formats a time according to user settings using Luxon
 */
export function formatTime(
  date: Date | string,
  settings?: IUserSettings
): string {
  const timeFormat = settings?.time?.timeFormat || ETimeFormat.TWELVE_HOUR;
  const timeZone =
    settings?.time?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  const formatString = getTimeFormatString(timeFormat);

  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date, { zone: timeZone })
      : DateTime.fromJSDate(date, { zone: timeZone });

  return dt.toFormat(formatString);
}

/**
 * Formats a date and time according to user settings using Luxon
 */
export function formatDateTime(
  date: Date | string,
  settings?: IUserSettings
): string {
  const dateStr = formatDate(date, settings);
  const timeStr = formatTime(date, settings);
  return `${dateStr} ${timeStr}`;
}

/**
 * Formats a date and time using a specific timezone instead of user timezone
 */
export function formatDateTimeWithTimezone(
  date: Date | string,
  timezone?: string,
  settings?: IUserSettings
): string {
  if (!date) return "-";

  const dateFormat = settings?.time?.dateFormat || EDateFormat.MMM_DD_YYYY;
  const timeFormat = settings?.time?.timeFormat || ETimeFormat.TWELVE_HOUR;
  
  // Use provided timezone, otherwise fall back to user timezone or system timezone
  const timeZone =
    timezone ||
    settings?.time?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const dateFormatString = getDateFormatString(dateFormat);
  const timeFormatString = getTimeFormatString(timeFormat);

  const dt =
    typeof date === "string"
      ? DateTime.fromISO(date, { zone: timeZone })
      : DateTime.fromJSDate(date, { zone: timeZone });

  if (!dt.isValid) {
    return "-";
  }

  const formattedDate = dt.toFormat(dateFormatString);
  const formattedTime = dt.toFormat(timeFormatString);

  return `${formattedDate} ${formattedTime}`;
}

/**
 * Formats a timestamp (createdAt, updatedAt, etc.) according to user settings
 */
export function formatTimestamp(
  date: Date | string,
  settings?: IUserSettings
): string {
  return formatDateTime(date, settings);
}

/**
 * Formats a time string according to user settings (12-hour or 24-hour format)
 */
export function formatTimeString(
  timeString: string,
  settings?: IUserSettings
): string {
  if (!timeString || !timeString.includes(":")) {
    return timeString;
  }

  const [hours, minutes] = timeString.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    return timeString;
  }

  const timeFormat = settings?.time?.timeFormat || ETimeFormat.TWELVE_HOUR;
  const is12Hour = timeFormat === ETimeFormat.TWELVE_HOUR;

  if (!is12Hour) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  }

  const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const ampm = hours >= 12 ? "PM" : "AM";

  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

/**
 * Formats a date string according to user settings
 */
export function formatDateString(
  dateString: string,
  settings?: IUserSettings
): string {
  if (!dateString) {
    return dateString;
  }

  const dateFormat = settings?.time?.dateFormat || EDateFormat.MMM_DD_YYYY;
  const formatString = getDateFormatString(dateFormat);

  const dt = DateTime.fromISO(dateString);
  if (!dt.isValid) {
    return dateString;
  }

  return dt.toFormat(formatString);
}
