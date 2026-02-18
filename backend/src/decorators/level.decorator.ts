import { SetMetadata } from '@nestjs/common';

export const MIN_USER_LEVEL_METADATA = 'minUserLevel';
export const REQUIRE_USER_LEVELS_METADATA = 'requireUserLevels';

export const MinUserLevel = (level: number) =>
  SetMetadata(MIN_USER_LEVEL_METADATA, level);

export const RequireUserLevels = (levels: number[]) =>
  SetMetadata(REQUIRE_USER_LEVELS_METADATA, levels);
