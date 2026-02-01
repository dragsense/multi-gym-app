import { SetMetadata } from '@nestjs/common';
import { EPermissionAction } from '@shared/enums/role/permission.enum';

export const ACTION_KEY = 'action';

/**
 * Decorator to specify the action for permission checking
 * @param action The action name
 */
export const Action = (action: EPermissionAction) =>
  SetMetadata(ACTION_KEY, action);
