import { EResource } from '@shared/enums';
import { EPermissionAction } from '@shared/enums';

export interface PrivilegeConfig {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

export interface PrivilegesConfigFile {
  privileges: PrivilegeConfig[];
}

export const privilegesConfig: PrivilegesConfigFile = {
  privileges: [
    {
      name: 'trainer',
      displayName: 'Trainer Privilege',
      description: 'Privilege bundle for trainers with session, billing, service offers, and chat permissions',
      permissions: [
        `${EResource.SESSIONS}:${EPermissionAction.MANAGE}`,
        `${EResource.BILLINGS}:${EPermissionAction.READ}`,
        `${EResource.SERVICE_OFFERS}:${EPermissionAction.MANAGE}`,
        `${EResource.CHAT}:${EPermissionAction.CREATE}`,
        `${EResource.CHAT}:${EPermissionAction.READ}`,
        `${EResource.CHECKINS}:${EPermissionAction.READ}`,
        `${EResource.FAQS}:${EPermissionAction.READ}`,
        `${EResource.MEMBERS}:${EPermissionAction.READ}`,
        `${EResource.STAFF}:${EPermissionAction.READ}`,

      ],
    },
    {
      name: 'member',
      displayName: 'Member Privilege',
      description: 'Privilege bundle for members with session, billing, and chat permissions',
      permissions: [
        `${EResource.MEMBERSHIPS}:${EPermissionAction.READ}`,
        `${EResource.SESSIONS}:${EPermissionAction.READ}`,
        `${EResource.SESSIONS}:${EPermissionAction.CREATE}`,
        `${EResource.BILLINGS}:${EPermissionAction.READ}`,
        `${EResource.CHAT}:${EPermissionAction.CREATE}`,
        `${EResource.CHAT}:${EPermissionAction.READ}`,
        `${EResource.CHECKINS}:${EPermissionAction.READ}`,
        `${EResource.FAQS}:${EPermissionAction.READ}`,
        `${EResource.MEMBERS}:${EPermissionAction.READ}`,
        `${EResource.STAFF}:${EPermissionAction.READ}`,

      ],
    },
    {
      name: 'staff',
      displayName: 'Staff Privilege',
      description: 'Privilege bundle for staff with task, billing, and chat permissions',
      permissions: [
        `${EResource.TASKS}:${EPermissionAction.READ}`,
        `${EResource.BILLINGS}:${EPermissionAction.READ}`,
        `${EResource.CHAT}:${EPermissionAction.READ}`,
        `${EResource.CHAT}:${EPermissionAction.CREATE}`,
        `${EResource.CHECKINS}:${EPermissionAction.READ}`,
        `${EResource.FAQS}:${EPermissionAction.READ}`,
      ],
    },
  ],
};
