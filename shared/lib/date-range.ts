// utils/date-range.ts

export function safeDateFrom(value?: string | Date): Date | undefined {
  if (!value) return undefined;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

