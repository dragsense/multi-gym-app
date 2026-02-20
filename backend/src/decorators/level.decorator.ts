import { SetMetadata } from '@nestjs/common';

export const MIN_USER_LEVEL_METADATA = 'minUserLevel';
export const REQUIRED_USER_LEVELS_METADATA = 'requiredUserLevels';

export const MinUserLevel = (level: number) =>
  SetMetadata(MIN_USER_LEVEL_METADATA, level);

export const RequiredUserLevels = (levels: number[]) =>
  SetMetadata(REQUIRED_USER_LEVELS_METADATA, levels);
