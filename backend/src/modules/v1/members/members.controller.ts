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
import { SelectQueryBuilder } from 'typeorm';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiTags('Members')
@MinUserLevel(EUserLevels.ADMIN)
@Resource(EResource.MEMBERS)
@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
  ) { }

  @ApiOperation({ summary: 'Get current user member profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns member if exists, null otherwise',
    type: MemberDto,
  })
  @MinUserLevel(EUserLevels.MEMBER)
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
  @MinUserLevel(EUserLevels.STAFF)
  async findAll(@Query() query: MemberListDto, @AuthUser() currentUser: User) {
    const locationId = (query as any).locationId;
    return this.membersService.get(query, MemberListDto, {
      beforeQuery: (qb: SelectQueryBuilder<Member>) => {
        if (locationId) {
          qb.andWhere(
            `entity.id IN (
              SELECT mm."memberId" FROM member_memberships mm
              JOIN memberships m ON m.id = mm."membershipId"
              WHERE mm."isActive" = true
              AND (
                EXISTS (SELECT 1 FROM membership_doors md JOIN doors d ON d.id = md."doorId" WHERE md."membershipId" = m.id AND d."locationId" = :memberLocationId)
                OR NOT EXISTS (SELECT 1 FROM membership_doors md WHERE md."membershipId" = m.id)
              )
            )`,
            { memberLocationId: locationId },
          );
        }
        return qb;
      },
    });
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
  @MinUserLevel(EUserLevels.STAFF)
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
