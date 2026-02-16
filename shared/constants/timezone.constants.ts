/**
 * Fallback timezone list if Intl.supportedValuesOf is not available
 */
const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Madrid",
  "Europe/Amsterdam",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Europe/Zurich",
  "Europe/Athens",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Jakarta",
  "Asia/Manila",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Taipei",
  "Asia/Riyadh",
  "Asia/Kuwait",
  "Asia/Baghdad",
  "Asia/Tehran",
  "Asia/Jerusalem",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Pacific/Fiji",
];

/**
 * Get all available timezones
 * Uses Intl.supportedValuesOf if available, otherwise falls back to constant list
 */
function getAllTimezones(): string[] {
  if (typeof Intl !== "undefined") {
    const intlWithSupportedValues = Intl as typeof Intl & {
      supportedValuesOf?: (type: "timeZone") => string[];
    };

    if (intlWithSupportedValues.supportedValuesOf) {
      try {
        return intlWithSupportedValues.supportedValuesOf("timeZone");
      } catch {
        return FALLBACK_TIMEZONES;
      }
    }
  }
  return FALLBACK_TIMEZONES;
}

/**
 * Get timezone options with system timezone included if not already present
 */
export function getTimezoneOptionsWithSystem(): Array<{
  value: string;
  label: string;
}> {
  const timezones = getAllTimezones();
  const systemTz =
    typeof Intl !== "undefined" && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";

  const options = timezones.map((tz) => ({ value: tz, label: tz }));

  // Add system timezone at the beginning if not already present
  if (timezones.indexOf(systemTz) === -1) {
    return [{ value: systemTz, label: systemTz }, ...options];
  }

  return options;
}
