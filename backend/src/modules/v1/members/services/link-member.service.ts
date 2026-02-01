import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { LinkMember } from '../entities/link-member.entity';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';

import {
  CreateLinkMemberDto,
  LinkMemberListDto,
  UpdateLinkMemberDto,
} from '@shared/dtos/member-dtos/link-member.dto';
import { MembersService } from '../members.service';
import { User } from '@/common/base-user/entities/user.entity';
import { IPaginatedResponse } from '@shared/interfaces';
import { SingleQueryDto } from '@shared/dtos/common/list-query.dto';

@Injectable()
export class LinkMemberService extends CrudService<LinkMember> {
  constructor(
    @InjectRepository(LinkMember)
    linkMemberRepo: Repository<LinkMember>,
    private readonly membersService: MembersService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      searchableFields: [
        'primaryMember.user.email',
        'primaryMember.user.firstName',
        'primaryMember.user.lastName',
        'linkedMember.user.email',
        'linkedMember.user.firstName',
        'linkedMember.user.lastName',
      ],
    };
    super(linkMemberRepo, moduleRef, crudOptions);
  }

  async findCurrentUserLinkMembers(query: LinkMemberListDto, currentUser: User): Promise<IPaginatedResponse<LinkMember>> {
    const member = await this.membersService.getSingle({ userId: currentUser.id });
    if (!member) throw new NotFoundException('Member not found');

    return this.get(query, LinkMemberListDto, {
      beforeQuery: (queryBuilder: SelectQueryBuilder<LinkMember>) => {
        queryBuilder.andWhere('entity.primaryMemberId = :primaryMemberId', { primaryMemberId: member.id });
        return queryBuilder;
      },
    });
  }

  async findOne(id: string, currentUser: User, query?: SingleQueryDto<LinkMember>): Promise<LinkMember> {
    const member = await this.membersService.getSingle({ userId: currentUser.id });
    if (!member) throw new NotFoundException('Member not found');

    const linkMember = await this.getSingle(id, query, {
      beforeQuery: (queryBuilder: SelectQueryBuilder<LinkMember>) => {
        queryBuilder.andWhere('entity.primaryMemberId = :primaryMemberId', { primaryMemberId: member.id });
        return queryBuilder;
      },
    });

    if (!linkMember) throw new NotFoundException('Link member not found');

    return linkMember;
  }

  async createLinkMember(createDto: CreateLinkMemberDto): Promise < LinkMember > {
      // Extract member IDs from DTOs
      const primaryMemberId = createDto.primaryMember?.id || (createDto.primaryMember as any)?.primaryMemberId;
      const linkedMemberId = createDto.linkedMember?.id || (createDto.linkedMember as any)?.linkedMemberId;

      if(!primaryMemberId || !linkedMemberId) {
      throw new BadRequestException('Both primary member and linked member are required');
    }

    // Prevent linking a member to itself
    if (primaryMemberId === linkedMemberId) {
      throw new BadRequestException('A member cannot be linked to itself');
    }

    // Check if the link already exists
    const existingLink = await this.getSingle({
      primaryMemberId,
      linkedMemberId,
    });

    if (existingLink) {
      throw new BadRequestException('These members are already linked');
    }

    // Verify both members exist
    const [primaryMember, linkedMember] = await Promise.all([
      this.membersService.getSingle(primaryMemberId),
      this.membersService.getSingle(linkedMemberId),
    ]);

    if (!primaryMember) {
      throw new BadRequestException('Primary member not found');
    }

    if (!linkedMember) {
      throw new BadRequestException('Linked member not found');
    }

    return this.create({
      primaryMember,
      linkedMember,
      viewSessionCheck: createDto.viewSessionCheck ?? false,
      notes: createDto.notes,
    });
  }

  async updateLinkMember(
    id: string,
    updateDto: UpdateLinkMemberDto,
  ): Promise<LinkMember> {
    return this.update(id, updateDto);
  }

  async toggleViewSessionCheck(id: string): Promise<LinkMember> {
    const linkMember = await this.getSingle(id);
    if (!linkMember) {
      throw new BadRequestException('Link member not found');
    }
    return this.update(id, {
      viewSessionCheck: !linkMember.viewSessionCheck,
    });
  }

}
