import { LoggerService } from '@/common/logger/logger.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseUsersService } from '../base-users.service';
import { User } from '../entities/user.entity';
import { EUserLevels } from '@shared/enums';

@Injectable()
export class UserSeed {
  private readonly logger = new LoggerService(UserSeed.name);
  constructor(
    private readonly baseUsersService: BaseUsersService,
    private configService: ConfigService,
  ) { }

  async run(): Promise<void> {
    const platformOwnerConfig = this.configService.get('platformOwner') as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    };

    if (!platformOwnerConfig) {
      this.logger.warn(
        'Platform owner configuration not found, skipping user seed...',
      );
      return;
    }

    try {
      // Check if admin user already exists
      const platformOwner = await this.baseUsersService.getSingle({
        level: EUserLevels.PLATFORM_OWNER,
      });

      if (platformOwner) {
        this.logger.log(
          `Platform owner already exists: ${platformOwner.email}, skipping seed...`,
        );
        return;
      }
    } catch {
      // User doesn't exist, continue with creation
      this.logger.log('Platform owner user not found, proceeding with creation...');
    }

    try {
      // Create admin user using user service
      const createUserDto = {
        email: platformOwnerConfig.email,
        password: platformOwnerConfig.password,
        isActive: true,
        level: EUserLevels.PLATFORM_OWNER,
        firstName: platformOwnerConfig.firstName || 'Platform Owner',
        lastName: platformOwnerConfig.lastName || 'User',
        isPlatformOwner: true,
      };

      this.logger.log(
        `Creating platform owner user with email: ${platformOwnerConfig.email}`,
      );

      const user = await this.baseUsersService.create(createUserDto);

      this.logger.log(
        `Platform owner user seeded successfully: ${platformOwnerConfig.email}`,
      );
      this.logger.log(`User created with ID: ${user?.id}`);
    } catch (error: unknown) {
      this.logger.error(
        'Error seeding platform owner user:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }
}
