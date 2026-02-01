import { SetMetadata, CustomDecorator } from '@nestjs/common';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';

export const REQUIRE_MODULE_KEY = 'requireModule';

/**
 * Decorator to mark a route as requiring specific subscription module(s).
 * The ModuleAccessGuard will check if the business has access to these modules.
 * 
 * @param modules - One or more subscription features/modules required for this route
 * 
 * @example
 * // Require single module
 * @RequireModule(ESubscriptionFeatures.TASKS)
 * 
 * @example
 * // Require multiple modules (user needs ALL of them)
 * @RequireModule(ESubscriptionFeatures.TASKS, ESubscriptionFeatures.SESSIONS)
 */
export const RequireModule = (...modules: ESubscriptionFeatures[]): CustomDecorator<string> =>
  SetMetadata(REQUIRE_MODULE_KEY, modules);
