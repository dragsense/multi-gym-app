import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { LinkMemberService } from '../services/link-member.service';
import { LinkMember } from '../entities/link-member.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';
import {
  CreateLinkMemberDto,
  UpdateLinkMemberDto,
  LinkMemberDto,
  LinkMemberListDto,
  SingleQueryDto,
  LinkMemberPaginatedDto,
} from '@shared/dtos';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';

@ApiBearerAuth('access-token')
@ApiTags('Link Members')
@MinUserLevel(EUserLevels.ADMIN)
@Resource(EResource.LINK_MEMBERS)
@Controller('link-members')
export class LinkMemberController {
  constructor(
    private readonly linkMemberService: LinkMemberService,
  ) { }

  @ApiOperation({ summary: 'Get all link members for a primary member' })
  @ApiParam({ name: 'memberId', description: 'Primary member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all link members for the primary member',
    type: LinkMemberPaginatedDto,
  })
  @Get()
  async findAll(@Query() query: LinkMemberListDto) {

    if (!query.primaryMemberId) {
      throw new BadRequestException('Primary member ID is required');
    }

    return this.linkMemberService.get(query, LinkMemberListDto, {
      beforeQuery: (queryBuilder: SelectQueryBuilder<LinkMember>) => {
        queryBuilder.andWhere('entity.primaryMemberId = :primaryMemberId', { primaryMemberId: query.primaryMemberId });
        return queryBuilder;
      },
    });
  }


  @ApiOperation({ summary: 'Get all link members for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Returns all link members for the current user',
    type: LinkMemberPaginatedDto,
  })
  @MinUserLevel(EUserLevels.MEMBER)
  @Get('current-user')
  async findCurrentUserLinkMembers(@Query() query: LinkMemberListDto, @AuthUser() currentUser: User) {
    return this.linkMemberService.findCurrentUserLinkMembers(query, currentUser);
  }

  @ApiOperation({ summary: 'Get a single link member by ID' })
  @ApiParam({ name: 'id', description: 'Link member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns link member by ID',
    type: LinkMemberDto,
  })
  @MinUserLevel(EUserLevels.MEMBER)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<LinkMember>,
    @AuthUser() currentUser: User,
  ) {

    if (currentUser.level === EUserLevels.ADMIN) {
      return this.linkMemberService.getSingle(id, query);
    }

    return this.linkMemberService.findOne(id, currentUser, query);
  }

  @ApiOperation({ summary: 'Create a new link member' })
  @ApiBody({
    type: CreateLinkMemberDto,
    description: 'Create a new link member',
  })
  @ApiResponse({
    status: 201,
    description: 'Link member created successfully',
    type: LinkMemberDto,
  })
  @Post()
  async create(@Body() createDto: CreateLinkMemberDto) {
    return this.linkMemberService.createLinkMember(createDto);
  }

  @ApiOperation({ summary: 'Update link member by ID' })
  @ApiParam({ name: 'id', description: 'Link member ID' })
  @ApiBody({
    type: UpdateLinkMemberDto,
    description: 'Update link member information',
  })
  @ApiResponse({
    status: 200,
    description: 'Link member updated successfully',
    type: LinkMemberDto,
  })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLinkMemberDto,
  ) {
    return this.linkMemberService.updateLinkMember(id, updateDto);
  }

  @ApiOperation({ summary: 'Toggle view session check for link member' })
  @ApiParam({ name: 'id', description: 'Link member ID' })
  @ApiResponse({
    status: 200,
    description: 'View session check toggled successfully',
    type: LinkMemberDto,
  })
  @Patch(':id/toggle-view-session')
  async toggleViewSessionCheck(@Param('id') id: string) {
    return this.linkMemberService.toggleViewSessionCheck(id);
  }

  @ApiOperation({ summary: 'Delete link member by ID' })
  @ApiParam({ name: 'id', description: 'Link member ID' })
  @ApiResponse({ status: 200, description: 'Link member deleted successfully' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.linkMemberService.delete(id);
    return { message: 'Link member deleted successfully' };
  }

}
