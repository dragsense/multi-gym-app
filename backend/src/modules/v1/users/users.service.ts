import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, SelectQueryBuilder } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '@/common/base-user/entities/user.entity';
import {
  CreateUserDto,
  SingleQueryDto,
  UpdateUserDto,
  UserListDto,
} from '@shared/dtos';
import { IMessageResponse, IPaginatedResponse } from '@shared/interfaces';
import { ResetPasswordDto } from '@shared/dtos/user-dtos/reset-password.dto';
import { PasswordService } from './services/password.service';
import { TokenService } from '../auth/services/tokens.service';
import { UserEmailService } from './services/user-email.service';
import { LoggerService } from '@/common/logger/logger.service';
import { ProfilesService } from './profiles/profiles.service';
import { BaseUsersService } from '@/common/base-user/base-users.service';
import { EUserLevels } from '@shared/enums/user.enum';
import { Profile } from './profiles/entities/profile.entity';
import { RequestContext } from '@/common/context/request-context';
import { RolesService } from '@/common/roles/roles.service';
import { PermissionsService } from '@/common/roles/services/permissions.service';
import { UserRole } from '@/common/roles/entities/user-role.entity';
import { UserPermission } from '@/common/roles/entities/user-permission.entity';
import { PrivilegeAssignmentService } from './services/privilege-assignment.service';

@Injectable()
export class UsersService {
  private readonly customLogger = new LoggerService(UsersService.name);

  constructor(
    private readonly baseUsersService: BaseUsersService,
    private readonly profielService: ProfilesService,
    private readonly passwordService: PasswordService,
    private readonly userEmailService: UserEmailService,
    private tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly permissionsService: PermissionsService,
    private readonly privilegeAssignmentService: PrivilegeAssignmentService,
    ) {}

  private generateStrongPassword(length: number): string {
    const chars = {
      alpha: 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz',
      numeric: '23456789',
      special: '!@#$%^&*',
    };

    let password = '';
    // Ensure at least one of each type
    password += chars.alpha.charAt(
      Math.floor(Math.random() * chars.alpha.length),
    );
    password += chars.numeric.charAt(
      Math.floor(Math.random() * chars.numeric.length),
    );
    password += chars.special.charAt(
      Math.floor(Math.random() * chars.special.length),
    );

    // Fill remaining with random characters
    const allChars = chars.alpha + chars.numeric + chars.special;
    for (let i = password.length; i < length; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  }

  async getSuperAdmin(): Promise<User> {
    const superAdmin = await this.baseUsersService.getSingle({
      level: EUserLevels.SUPER_ADMIN,
    });
    if (!superAdmin) throw new NotFoundException('Super Admin not found');
    return superAdmin;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.baseUsersService.getUserByEmailWithPassword(email);
  }

  async getUser(payload: any, query?: SingleQueryDto<User>): Promise<User> {
    const user = await this.baseUsersService.getSingle(payload, query);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async getUserByIdWithRefUserId(id: string): Promise<User | null> {
    return this.baseUsersService.getUserByIdWithRefUserId(id);
  }

  async getUsers(
    query: UserListDto,
    currentUser: User,
  ): Promise<IPaginatedResponse<User>> {
    return this.baseUsersService.get(query, UserListDto, {
      beforeQuery: (query: SelectQueryBuilder<User>) => {
        // Skip current user
        query.andWhere('entity.id != :currentUserId', {
          currentUserId: currentUser.id,
        });

        // SUPER_ADMIN, ADMIN and PLATFORM_OWNER can see all users in their business
        // STAFF and below can only see users they created
        if (currentUser.level !== (EUserLevels.PLATFORM_OWNER as number) &&
          currentUser.level !== (EUserLevels.SUPER_ADMIN as number) &&
          currentUser.level !== (EUserLevels.ADMIN as number)) {
          query.andWhere('entity.createdByUserId = :createdByUserId', {
            createdByUserId: currentUser.id,
          });
        }
      },
    });
  }

  async createUser(
    createUserDto: CreateUserDto,
    privilegeName?: 'trainer' | 'member' | 'staff',
  ): Promise<IMessageResponse & { user: User }> {
    // Prevent creating users with level 0 (PLATFORM_OWNER)
    // Level 0 can only be assigned by the seeder
    if (createUserDto.level === (EUserLevels.PLATFORM_OWNER as number)) {
      throw new ConflictException('Cannot create user with THIS level.');
    }

    // Check if email exists

    let tempPassword: string | undefined;

    if (!createUserDto.password) {
      tempPassword = this.generateStrongPassword(12);
      createUserDto.password = tempPassword;
    }

    // Extract profile, roles, and permissions data if present
    const { profile, roles, permissions, ...userData } = createUserDto;

    // Use CRUD service create method
    const user = await this.baseUsersService.create(userData, {
      beforeCreate: async (
        processedData: CreateUserDto,
        manager: EntityManager,
      ) => {
        const existingUser = await manager.findOne(User, {
          where: {
            email: processedData.email,
          },
        });

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
        return {
          ...processedData,
          tempPassword,
        };
      },
      afterCreate: async (savedUser: User, manager: EntityManager) => {
        // Create profile if profile data is provided
        if (profile) {
          const profileRepo = manager.getRepository(Profile);
          await profileRepo.save({
            user: savedUser,
            userId: savedUser.id,
            ...profile,
          });
        }

        // Assign roles and permissions if provided
        if (roles?.length || permissions?.length) {
          await this.assignRolesAndPermissions(
            savedUser.id,
            roles,
            permissions,
            manager,
          );
        }

        if (privilegeName) {
          await this.privilegeAssignmentService.assignPrivilegeToUser(savedUser.id, privilegeName, manager);
        }

        return savedUser;
      },
    });

    user.password = tempPassword as string;
    user.passwordHistory = [];

    return { message: 'User created successfully.', user };
  }

  /**
   * Assign roles and permissions to a user
   */
  private async assignRolesAndPermissions(
    userId: string,
    roles?: { id: string }[],
    permissions?: { id: string }[],
    manager?: EntityManager,
  ): Promise<void> {
    if ((!roles || roles.length === 0) && (!permissions || permissions.length === 0)) {
      return;
    }

    const userRoleRepo = manager?.getRepository(UserRole) || this.baseUsersService.getRepository().manager.getRepository(UserRole);
    const userPermissionRepo = manager?.getRepository(UserPermission) || this.baseUsersService.getRepository().manager.getRepository(UserPermission);
    const roleRepo = this.rolesService.getRepository();
    const permissionRepo = this.permissionsService.getRepository();

    // Process roles and permissions in parallel
    const [roleIds, permissionIds] = await Promise.all([
      roles && roles.length > 0
        ? (async () => {
          const ids = roles.map((r) => r.id).filter(Boolean);
          if (ids.length === 0) return [];

          // Validate roles exist
          const existingRoles = await roleRepo.find({
            where: ids.map((id) => ({ id })),
          });

          if (existingRoles.length !== ids.length) {
            const foundIds = new Set(existingRoles.map((r) => r.id));
            const missingIds = ids.filter((id) => !foundIds.has(id));
            throw new ConflictException(`Roles not found: ${missingIds.join(', ')}`);
          }

          return ids;
        })()
        : Promise.resolve([]),
      permissions && permissions.length > 0
        ? (async () => {
          const ids = permissions.map((p) => p.id).filter(Boolean);
          if (ids.length === 0) return [];

          // Validate permissions exist
          const existingPermissions = await permissionRepo.find({
            where: ids.map((id) => ({ id })),
          });

          if (existingPermissions.length !== ids.length) {
            const foundIds = new Set(existingPermissions.map((p) => p.id));
            const missingIds = ids.filter((id) => !foundIds.has(id));
            throw new ConflictException(`Permissions not found: ${missingIds.join(', ')}`);
          }

          return ids;
        })()
        : Promise.resolve([]),
    ]);

    // Create user_role and user_permission entries in parallel
    await Promise.all([
      roleIds.length > 0
        ? userRoleRepo.save(
          roleIds.map((roleId) =>
            userRoleRepo.create({ userId, roleId }),
          ),
        )
        : Promise.resolve(),
      permissionIds.length > 0
        ? userPermissionRepo.save(
          permissionIds.map((permissionId) =>
            userPermissionRepo.create({ userId, permissionId }),
          ),
        )
        : Promise.resolve(),
    ]);
  }

  /**
   * Update roles and permissions for a user (replace existing)
   */
  private async updateRolesAndPermissions(
    userId: string,
    roles?: { id: string }[],
    permissions?: { id: string }[],
    manager?: EntityManager,
  ): Promise<void> {
    if (roles === undefined && permissions === undefined) {
      return;
    }

    const userRoleRepo = manager?.getRepository(UserRole) || this.baseUsersService.getRepository().manager.getRepository(UserRole);
    const userPermissionRepo = manager?.getRepository(UserPermission) || this.baseUsersService.getRepository().manager.getRepository(UserPermission);

    // Delete and assign in parallel
    await Promise.all([
      roles !== undefined
        ? (async () => {
          await userRoleRepo.delete({ userId });
          if (roles.length > 0) {
            await this.assignRolesAndPermissions(userId, roles, undefined, manager);
          }
        })()
        : Promise.resolve(),
      permissions !== undefined
        ? (async () => {
          await userPermissionRepo.delete({ userId });
          if (permissions.length > 0) {
            await this.assignRolesAndPermissions(userId, undefined, permissions, manager);
          }
        })()
        : Promise.resolve(),
    ]);
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<IMessageResponse> {
    // Get existing user to check current level
    const existingUser = await this.baseUsersService.getSingle({ id });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Extract profile, roles, and permissions data if present
    const { profile, roles, permissions, ...userData } = updateUserDto;

    // Update user data with callbacks
    await this.baseUsersService.update(id, userData, {
      beforeUpdate: async (
        processedData: UpdateUserDto,
        existingEntity: User,
        manager: EntityManager,
      ) => {
        // Check if email is being changed and if it already exists
        if (
          updateUserDto.email &&
          updateUserDto.email !== existingEntity.email
        ) {
          const emailExists = await this.baseUsersService.getSingle({
            where: { email: updateUserDto.email },
          });

          if (emailExists) {
            throw new ConflictException('Email already exists');
          }
        }

        return {
          ...processedData,
          password: undefined,
          isVerified: undefined,
          level: undefined,
        };
      },
      afterUpdate: async (updatedUser: User, manager: EntityManager) => {
        // Update profile if profile data is provided
        if (profile) {
          const profileRepo = manager.getRepository(Profile);
          const existingProfile = await profileRepo.findOne({
            where: { user: { id: updatedUser.id } },
          });

          if (existingProfile) {
            await profileRepo.update(existingProfile.id, profile);
          } else {
            // Create profile if it doesn't exist
            await profileRepo.save({
              user: updatedUser,
              ...profile,
            });
          }
        }

        // Update roles and permissions if provided
        if (roles !== undefined || permissions !== undefined) {
          await this.updateRolesAndPermissions(
            updatedUser.id,
            roles,
            permissions,
            manager,
          );
        }

        return updatedUser;
      },
    });

    return {
      message: 'User updated successfully',
    };
  }

  async deleteUser(id: string): Promise<IMessageResponse> {
    await this.baseUsersService.delete(id, {
      afterDelete: async (entity: User, manager: EntityManager) => {
        const profile = await this.profielService.getSingle({
          userId: entity.id,
        });
        if (profile) {
          await this.profielService.delete(profile.id);
        }
      },
    });
    return {
      message: 'User deleted successfully',
    };
  }

  async resetPassword(
    id: string,
    resetPasswordDto: ResetPasswordDto,
    force: boolean = false,
  ): Promise<IMessageResponse & { success: true }> {
    const { currentPassword, password } = resetPasswordDto;

    const user = await this.baseUsersService.getUserByIdWithPassword(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.passwordService.validatePasswordChange(user, password);

    if (!force) {
      if (!currentPassword) {
        throw new ConflictException('Current password is required');
      }

      // Check if user has a password set (might be null for OAuth users)
      if (!user.password) {
        throw new ConflictException(
          'User does not have a password set. Please use password reset flow.',
        );
      }

      const isOldPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isOldPasswordValid) {
        throw new ConflictException('Old password is incorrect');
      }
    }

    if (user.password) {
      const isSameAsOld = await bcrypt.compare(password, user.password);
      if (isSameAsOld) {
        throw new ConflictException(
          'New password must be different from the old password',
        );
      }
    }

    user.password = password;

    const savedUser = await this.baseUsersService.update(user.id, user);

    await this.tokenService.invalidateAllTokens(user.id);

    // Emit password reset event for email sending
    // Include tenantId for multi-tenant database routing in event handlers
    const tenantId = RequestContext.get<string>('tenantId');
    this.baseUsersService.eventService.emit('user.password.reset', {
      entity: savedUser,
      entityId: user.id,
      operation: 'resetPassword',
      source: 'user',
      tableName: 'users',
      timestamp: new Date(),
      data: {
        type: 'confirmation',
        tenantId, // Pass tenant context
      },
    });

    return {
      message: 'Password reset successfully',
      success: true,
    };
  }
}
