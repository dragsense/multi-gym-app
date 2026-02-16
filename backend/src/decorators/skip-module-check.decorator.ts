import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const SKIP_MODULE_CHECK_KEY = 'skipModuleCheck';

/**
 * Decorator to skip module access check for a specific route or controller.
 * Use this when a route should be accessible regardless of subscription modules.
 * 
 * @example
 * @SkipModuleCheck()
 * @Get('public-data')
 * getPublicData() {}
 */
export const SkipModuleCheck = (): CustomDecorator<string> =>
  SetMetadata(SKIP_MODULE_CHECK_KEY, true);
