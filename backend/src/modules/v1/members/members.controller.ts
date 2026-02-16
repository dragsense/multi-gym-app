import {
  Controller,
  Get,
  Body,
  Post,
  Delete,
  Param,
  Query,
  Patch,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { MembersService } from './members.service';
import {
  CreateMemberDto,
  UpdateMemberDto,
  MemberListDto,
  MemberPaginatedDto,
  MemberDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Member } from './entities/member.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';
import { Profile } from '@/modules/v1/users/profiles/entities/profile.entity';
import { ProfilesService } from '../users/profiles/profiles.service';
import { In } from 'typeorm';

@ApiTags('Members')
@MinUserLevel(EUserLevels.STAFF)
@Resource(EResource.MEMBERS)
@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly profilesService: ProfilesService,
  ) { }

  @ApiOperation({ summary: 'Get current user member profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns member if exists, null otherwise',
    type: MemberDto,
  })
  @MinUserLevel(EUserLevels.STAFF)
  @Get('me')
  async getMyMember(@AuthUser() currentUser: User) {
    return this.membersService.getSingle({ userId: currentUser.id }, { _relations: ['user'] });
  }

  @ApiOperation({ summary: 'Get all members with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of members',
    type: MemberPaginatedDto,
  })
  @Get()
  async findAll(@Query() query: MemberListDto, @AuthUser() currentUser: User) {
    const isAdmin = currentUser.level === EUserLevels.ADMIN;
    const result = await this.membersService.get(query, MemberListDto, {
      beforeQuery: (query: SelectQueryBuilder<Member>) => {
        if (!isAdmin) {
          query
            .leftJoin(
              'trainer_members',
              'trainerMembers',
              'trainerMembers.memberId = entity.id',
            )
            .leftJoin('trainerMembers.trainer', 'memberTrainer')
            .andWhere(
              new Brackets((qb2) => {
                qb2
                  .where('entity.createdByUserId = :uid', {
                    uid: currentUser.id,
                  })
                  .orWhere('memberTrainer.userId = :uid', {
                    uid: currentUser.id,
                  });
              }),
            )
            .distinct(true);
        }
        return query;
      },
    });

    // Manually fetch profiles and attach to users
    if (result.data.length > 0) {
      const userIds = result.data
        .map((member) => member.user?.id)
        .filter((id) => !!id);

      if (userIds.length > 0) {
        const profiles = await this.profilesService.getRepository().find({
          where: {
            user: { id: In(userIds) },
          },
          relations: ['user'],
        });

        console.log('Fetching profiles for userIds:', userIds);
        console.log('Found profiles:', profiles.length, profiles.map(p => ({ id: p.id, userId: p.user?.id, phone: p.phoneNumber })));

        // Map profiles to members
        result.data.forEach((member) => {
          if (member.user) {
            const profile = profiles.find((p) => p.user?.id === member.user!.id);
            if (profile) {
              (member.user as any).profile = profile;
            }
          }
        });
      }
    }

    return result;
  }

  @ApiOperation({ summary: 'Get member by ID' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns member by ID',
    type: MemberDto,
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: SingleQueryDto<Member>) {
    return this.membersService.getSingle(id, query);
  }

  @ApiOperation({ summary: 'Add a new member' })
  @ApiBody({
    type: CreateMemberDto,
    description: 'Create a new member',
  })
  @ApiResponse({ status: 201, description: 'Member created successfully' })
  @Post()
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.createMember(createMemberDto);
  }

  @ApiOperation({ summary: 'Update member by ID' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiBody({
    type: UpdateMemberDto,
    description: 'Update member information',
  })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.membersService.updateMember(id, updateMemberDto);
  }

  @ApiOperation({ summary: 'Delete member by ID' })
  @ApiParam({ name: 'id', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member deleted successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.membersService.deleteMember(id);
  }
}
