import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { User } from '@/common/base-user/entities/user.entity';
import { Staff } from './entities/staff.entity';
import {
  CreateStaffDto,
  UpdateStaffDto,
  CreateUserDto,
  StaffListDto,
  SingleQueryDto,
} from '@shared/dtos';
import { UsersService } from '../users/users.service';
import { LocationsService } from '../locations/services/locations.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';

@Injectable()
export class StaffService extends CrudService<Staff> {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,
    private readonly usersService: UsersService,
    private readonly locationsService: LocationsService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['user.password'],
      searchableFields: [
        'user.email',
        'user.profile.firstName',
        'user.profile.lastName',
      ],
    };
    super(staffRepo, moduleRef, crudOptions);
  }

  async createStaff(
    createStaffDto: CreateStaffDto,
  ): Promise<IMessageResponse & { user?: User; }> {

    const { user, location, ...staffData } = createStaffDto;

    // Validate location if provided
    if (location?.id) {
      const locationEntity = await this.locationsService.getSingle(location.id);
      if (!locationEntity) {
        throw new NotFoundException('Location not found');
      }
    }

    // Ensure level is USER (staff level) - roles and permissions are handled in createUser
    const userData = {
      ...user,
      level: EUserLevels.STAFF,
    };

    let createdUser: User | null = null;

    await this.create(
      {
        ...staffData,
        ...(location?.id ? { location: { id: location.id } } : {}),
      },
      {
        afterCreate: async (savedEntity, manager) => {
          const privilegeName = createStaffDto.isTrainer ? 'trainer' : 'staff';
          const userResult = await this.usersService.createUser(userData as CreateUserDto, privilegeName);
          createdUser = userResult.user;
          await manager.update(Staff, savedEntity.id, {
            user: userResult.user,
          });
        },
      },
    );

    return {
      message: 'Staff member created successfully',
      user: createdUser!,
    };
  }


  async updateStaff(
    id: string,
    updateStaffDto: UpdateStaffDto,
  ): Promise<IMessageResponse> {

    const staff = await this.getSingle({
      id,
    }, { _relations: ['user'] });

    if (!staff) {
      throw new NotFoundException('Staff entity not found');
    }

    const { user: userUpdate, location, ...staffData } = updateStaffDto;

    // Validate location if provided
    if (location?.id) {
      const locationEntity = await this.locationsService.getSingle(location.id);
      if (!locationEntity) {
        throw new NotFoundException('Location not found');
      }
    }

    // Update staff entity
    await this.update(staff.id, {
      ...staffData,
      ...(location?.id ? {
        location: {
          id: location.id,
        },
      } : {}),
    }, {
      afterUpdate: async (existingEntity) => {
        try {
          const existingStaff = await this.getSingle(
            { id: existingEntity.id },
            { _relations: ['user'] },
          );

          if (!existingStaff)
            throw new NotFoundException('Staff not found');

          if (userUpdate && existingStaff.user)
            await this.usersService.updateUser(existingStaff.user.id, userUpdate);
        } catch (error) {
          throw new Error('Failed to update user', { cause: error as Error });
        }
      },
    });

    return {
      message: 'Staff member updated successfully',
    };
  }


  async deleteStaff(id: string): Promise<IMessageResponse> {
    // Find staff entity by user id
    const staff = await this.getSingle({
      id
    }, { _relations: ['user'] });

    if (!staff) {
      throw new NotFoundException('Staff entity not found');
    }

    await this.delete(staff.id, {
      beforeDelete: async (entity: Staff) => {
        if (entity.user) {
          await this.usersService.deleteUser(entity.user.id);
        }
      },
    });

    return { message: 'Staff member deleted successfully' };
  }

  async getCurrentUserStaff(
    currentUser: User,
    query?: SingleQueryDto,
  ): Promise<Staff | null> {
    return this.getSingle({ userId: currentUser.id }, {
      ...query,
      _relations: ['user'],
      _select: ['user.id', 'user.email', 'user.firstName', 'user.lastName'],
    });
  }

}
