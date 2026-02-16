import {
  Controller,
  Get,
  UseGuards,
  Body,
  Post,
  Patch,
  Delete,
  Param,
  Query,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { MembershipsService } from './memberships.service';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
  MembershipListDto,
  MembershipPaginatedDto,
  MembershipDto,
  SingleQueryDto,
} from '@shared/dtos';
import { Membership } from './entities/membership.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUserLevels } from '@shared/enums';
import { IMessageResponse } from '@shared/interfaces';
import { MinUserLevel } from '@/decorators/level.decorator';
import { SelectQueryBuilder } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { Timezone } from '@/decorators/timezone.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Memberships')
@Resource(EResource.MEMBERSHIPS)
@Controller('memberships')
@MinUserLevel(EUserLevels.ADMIN)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @ApiOperation({ summary: 'Get all memberships with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of memberships',
    type: MembershipPaginatedDto,
  })
  @MinUserLevel(EUserLevels.MEMBER)
  @Get()
  findAll(@Query() query: MembershipListDto) {
    return this.membershipsService.get(query, MembershipListDto);
  }

  @ApiOperation({ summary: 'Get membership by ID' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns membership by ID',
    type: MembershipDto,
  })
  @ApiResponse({ status: 404, description: 'Membership not found' })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Membership>,
  ) {
    const membership = await this.membershipsService.getSingle(id, query);
    if (!membership) throw new NotFoundException('Membership not found');
    return membership;
  }

  @ApiOperation({ summary: 'Add a new membership' })
  @ApiBody({
    type: CreateMembershipDto,
    description: 'Create a new membership',
  })
  @ApiResponse({ status: 201, description: 'Membership created successfully' })
  @Post()
  create(
    @Body() createMembershipDto: CreateMembershipDto,
    @AuthUser() currentUser: User,
  ) {
    return this.membershipsService.createMembership(createMembershipDto);
  }

  @ApiOperation({ summary: 'Update membership by ID' })
  @ApiParam({ name: 'id', description: 'Membership ID' })
  @ApiBody({
    type: UpdateMembershipDto,
    description: 'Update membership information',
  })
  @ApiResponse({ status: 200, description: 'Membership updated successfully' })
  @ApiResponse({ status: 404, description: 'Membership not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMembershipDto: UpdateMembershipDto,
    @AuthUser() currentUser: User,
  ) {
    return this.membershipsService.updateMembership(id, updateMembershipDto);
  }

  @ApiOperation({ summary: 'Delete membership by ID' })
  @ApiParam({
    name: 'id',
    description: 'Membership ID',
  })
  @ApiResponse({ status: 200, description: 'Membership deleted successfully' })
  @ApiResponse({ status: 404, description: 'Membership not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.membershipsService.delete(id);
    return { message: 'Membership deleted successfully' };
  }

}

