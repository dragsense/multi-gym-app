import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Member } from './entities/member.entity';
import { CreateMemberDto, UpdateMemberDto } from '@shared/dtos';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import { UsersService } from '../users/users.service';
import { PrivilegeAssignmentService } from '../users/services/privilege-assignment.service';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { User } from '@/common/base-user/entities/user.entity';
@Injectable()
export class MembersService extends CrudService<Member> {
  constructor(
    @InjectRepository(Member)
    memberRepo: Repository<Member>,
    private readonly userService: UsersService,
    private readonly privilegeAssignmentService: PrivilegeAssignmentService,
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
    super(memberRepo, moduleRef, crudOptions);
  }

  async createMember(
    createMemberDto: CreateMemberDto,
  ): Promise<IMessageResponse & { member: Member }> {
    const { user, ...memberData } = createMemberDto;
    const savedMember = await this.create(memberData, {
      afterCreate: async (savedEntity, manager) => {
        let savedUser: User | undefined;
        try {
          const createdUser = await this.userService.createUser({
            ...user,
            level: EUserLevels.MEMBER,
          }, 'member');
          savedUser = createdUser.user;
          savedEntity.user = savedUser;

          await manager.update(Member, savedEntity.id, {
            user: savedUser,
          });

        } catch (error) {
          if (savedUser) {
            this.userService.deleteUser(savedUser.id).catch((deleteError) => {
              this.logger.error(`Failed to delete user ${savedUser?.id}: ${deleteError.message}`);
            });
          }
          throw error;
        }
      },
    });

    return { message: 'Member created successfully', member: savedMember };
  }

  async updateMember(
    id: string,
    updateMemberDto: UpdateMemberDto,
  ): Promise<Member> {
    const { user, ...memberData } = updateMemberDto;
    return await this.update(id, memberData, {
      afterUpdate: async (existingEntity) => {
        try {
          const existingMember = await this.getSingle(
            { id: existingEntity.id },
            { _relations: ['user'] },
          );

          if (!existingMember) throw new NotFoundException('Member not found');

          console.log('existingMember', existingMember);
          console.log('user', user);

          if (user && existingMember.user)
            await this.userService.updateUser(existingMember.user.id, user);
        } catch (error) {
          throw error;
        }
      },
    });
  }

  async deleteMember(id: string): Promise<void> {
    await this.delete(id, {
      beforeDelete: async (entity: Member) => {
        if (entity.user) {
          await this.userService.deleteUser(entity.user.id);
        }
      },
    });
  }
}
