import { LoggerService } from '@/common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Resource } from '../entities/resource.entity';
import { EPermissionAction } from '@shared/enums';

@Injectable()
export class PermissionSeed {
  private readonly logger = new LoggerService(PermissionSeed.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generate display name for permission
   */
  private getPermissionDisplayName(resourceName: string, action: EPermissionAction): string {
    const resourceDisplay = this.capitalizeFirst(resourceName.replace(/_/g, ' '));
    const actionDisplay = this.capitalizeFirst(action);
    return `${actionDisplay} ${resourceDisplay}`;
  }

  /**
   * Generate description for permission
   */
  private getPermissionDescription(resourceName: string, action: EPermissionAction): string {
    const resourceDisplay = resourceName.replace(/_/g, ' ');
    const actionMap: Record<EPermissionAction, string> = {
      [EPermissionAction.CREATE]: 'Allow creating new',
      [EPermissionAction.READ]: 'Allow viewing',
      [EPermissionAction.UPDATE]: 'Allow updating',
      [EPermissionAction.DELETE]: 'Allow deleting',
      [EPermissionAction.MANAGE]: 'Full access to manage all',
    };
    return `${actionMap[action]} ${resourceDisplay}`;
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  async run(dataSource?: DataSource): Promise<void> {
    const targetDataSource = dataSource || this.dataSource;
    this.logger.log('🌱 Starting permission seeding...');

    const resourceRepository = targetDataSource.getRepository(Resource);
    const permissionRepository = targetDataSource.getRepository(Permission);

    // Get all resources from database
    const resources = await resourceRepository.find({
      where: { isActive: true },
    });

    if (resources.length === 0) {
      this.logger.warn('No resources found. Please seed resources first.');
      return;
    }

    this.logger.log(`Found ${resources.length} resources. Generating permissions...`);

    // Get all permission actions
    const actions = Object.values(EPermissionAction);

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    // Generate permissions for each resource and action combination
    for (const resource of resources) {
      this.logger.log(
        `Processing permissions for resource: ${resource.name} (${resource.id})`,
      );

      for (const action of actions) {
        try {
          // Generate permission name: resource:action
          const permissionName = `${resource.name}:${action}`;

          // Check if permission already exists
          const existingPermission = await permissionRepository.findOne({
            where: { name: permissionName },
          });

          if (existingPermission) {
            this.logger.log(`Permission already exists: ${permissionName}`);
            totalSkipped++;
            continue;
          }

          // Generate display name and description
          const displayName = this.getPermissionDisplayName(resource.name, action);
          const description = this.getPermissionDescription(resource.name, action);

          // Create new permission
          const permission = permissionRepository.create({
            name: permissionName,
            displayName,
            description,
            action,
            resourceId: resource.id,
            isSystem: true,
          });

          await permissionRepository.save(permission);
          this.logger.log(`Created permission: ${permissionName}`);
          totalCreated++;
        } catch (error) {
          this.logger.error(
            `Error creating permission ${resource.name}:${action}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          totalErrors++;
        }
      }
    }

    this.logger.log(
      `✅ Permission seeding completed. Created: ${totalCreated}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`,
    );
  }
}
