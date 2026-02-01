import { EUserLevels } from '@shared/enums/user.enum';


const LevelToUserRole = Object.entries(EUserLevels).reduce(
  (acc, [role, lvl]) => {
    acc[lvl] = role;
    return acc;
  },
  {} as Record<number, string>,
);

// Lookup by level
export const getUserRole = (level: number, cap: boolean = false): string => {
  let role = LevelToUserRole[level];
  if (!role) role = 'user';
  return cap ? capitalize(role) : role;
};

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();



