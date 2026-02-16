import { EUserLevels } from "../enums";

const LevelToUserRole = Object.entries(EUserLevels).reduce(
  (acc, [role, lvl]) => {
    acc[lvl] = role;
    return acc;
  },
  {} as Record<number, string>
);

// Lookup by level
export const getUserRole = (level: number, cap: boolean = false): string => {
  let role = LevelToUserRole[level];
  if (!role) role = "user";
  return cap ? capitalize(role) : role;
};

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.reduce<T[]>((acc, item) => {
    if (Array.isArray(item)) return acc.concat(flatten(item));
    return acc.concat(item);
  }, []);
}

export function formatValue(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}
