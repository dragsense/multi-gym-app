import { SetMetadata } from '@nestjs/common';

export const MIN_USER_LEVEL_METADATA = 'minUserLevel';

export const MinUserLevel = (level: number) =>
  SetMetadata(MIN_USER_LEVEL_METADATA, level);
