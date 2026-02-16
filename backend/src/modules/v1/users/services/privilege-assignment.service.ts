import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { UserPrivilege } from '@/common/roles/entities/user-privilege.entity';
import { UserPrivilegePermission } from '@/common/roles/entities/user-privilege-permission.entity';
import { Permission } from '@/common/roles/entities/permission.entity';
import { privilegesConfig, PrivilegesConfigFile } from '../config/privileges.config';

@Injectable()
export class PrivilegeAssignmentService {
  private readonly logger = new Logger(PrivilegeAssignmentService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Get privileges config
   */
  private getPrivilegesConfig(): PrivilegesConfigFile {
    return privilegesConfig;
  }

  /**
   * Assign a privilege to a user by privilege name
   */
  async assignPrivilegeToUser(
    userId: string,
    privilegeName: 'trainer' | 'member' | 'staff',
    manager?: EntityManager,
  ): Promise<UserPrivilege> {
    const targetManager = manager || this.dataSource.manager;
    const config = this.getPrivilegesConfig();

    // Find privilege config
    const privilegeConfig = config.privileges.find(
      (p) => p.name === privilegeName,
    );

    if (!privilegeConfig) {
      throw new Error(`Privilege "${privilegeName}" not found in config`);
    }

    const privilegeRepo = targetManager.getRepository(UserPrivilege);
    const privilegePermissionRepo =
      targetManager.getRepository(UserPrivilegePermission);
    const permissionRepo = targetManager.getRepository(Permission);

    // Get all permission entities
    const permissionEntities = await permissionRepo.find({
      where: privilegeConfig.permissions.map((name) => ({ name })),
    });

    if (permissionEntities.length !== privilegeConfig.permissions.length) {
      const foundNames = permissionEntities.map((p) => p.name);
      const missingNames = privilegeConfig.permissions.filter(
        (name) => !foundNames.includes(name),
      );
      throw new Error(
        `Permissions not found: ${missingNames.join(', ')} for privilege ${privilegeName}`,
      );
    }

    // Create user privilege
    const userPrivilege = privilegeRepo.create({
      userId,
    });
    const savedPrivilege = await privilegeRepo.save(userPrivilege);

    // Create privilege permissions
    const privilegePermissions = permissionEntities.map((permission) =>
      privilegePermissionRepo.create({
        userPrivilegeId: savedPrivilege.id,
        permissionId: permission.id,
      }),
    );

    await privilegePermissionRepo.save(privilegePermissions);

    this.logger.log(
      `Assigned privilege "${privilegeName}" to user ${userId} with ${permissionEntities.length} permissions`,
    );

    return savedPrivilege;
  }
}
