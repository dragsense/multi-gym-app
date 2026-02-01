import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { MemberMembershipHistoryService } from '../services/member-membership-history.service';
import {
  MemberMembershipHistoryListDto,
  MemberMembershipHistoryDto,
  MemberMembershipStatusDto,
} from '@shared/dtos';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Member Membership History')
@MinUserLevel(EUserLevels.ADMIN)
@Controller('member-membership-history')
export class MemberMembershipHistoryController {
  constructor(
    private readonly memberMembershipHistoryService: MemberMembershipHistoryService,
  ) {}

  @ApiOperation({ summary: 'Get all membership history for a member by member ID (deprecated, use paginated endpoint)' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all membership history entries for the member',
    type: [MemberMembershipHistoryDto],
  })
  @Get('member/:memberId/all')
  async getHistoryByMemberId(@Param('memberId') memberId: string) {
    return this.memberMembershipHistoryService.getHistoryByMemberId(memberId);
  }

  @ApiOperation({ summary: 'Get paginated membership history for a member by member ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated membership history entries for the member',
  })
  @Get('member/:memberId')
  async getPaginatedHistoryByMemberId(
    @Param('memberId') memberId: string,
    @Query() query: MemberMembershipHistoryListDto,
  ) {
    return this.memberMembershipHistoryService.get(
      query,
      MemberMembershipHistoryListDto,
      {
        beforeQuery: async (queryBuilder: any) => {
          queryBuilder
            .leftJoinAndSelect('entity.memberMembership', 'memberMembership')
            .leftJoinAndSelect('memberMembership.membership', 'membership')
            .leftJoinAndSelect('memberMembership.member', 'member')
            .andWhere('memberMembership.memberId = :memberId', { memberId });
          return queryBuilder;
        },
      },
    );
  }


  @ApiOperation({ summary: 'Get membership history by member membership ID' })
  @ApiParam({ name: 'memberMembershipId', description: 'Member Membership ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns membership history entries',
    type: [MemberMembershipHistoryDto],
  })
  @Get(':memberMembershipId')
  @MinUserLevel(EUserLevels.MEMBER)
  async getHistoryByMemberMembershipId(
    @Param('memberMembershipId') memberMembershipId: string,
    @Query() query: MemberMembershipHistoryListDto,
  ) {
    return this.memberMembershipHistoryService.getAll(
      { ...query, memberMembershipId: memberMembershipId },
      MemberMembershipHistoryListDto,
    );
  }
}

