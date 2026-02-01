import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    NotFoundException,
} from '@nestjs/common';
import {
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiTags,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger';

import { MemberMembershipService } from '../services/member-membership.service';
import {
    SingleQueryDto,
    MemberMembershipListDto,
    MemberMembershipDto,
    MemberMembershipStatusDto,
    CurrentMembershipSummaryDto,
    AdminAssignMembershipDto,
} from '@shared/dtos';
import { MemberMembership } from '../entities/member-membership.entity';
import { EUserLevels } from '@shared/enums';
import { MinUserLevel } from '@/decorators/level.decorator';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { IMessageResponse } from '@shared/interfaces';
import { Timezone } from '@/decorators/timezone.decorator';

@ApiBearerAuth('access-token')
@ApiTags('Member Memberships')
@Controller('member-memberships')
@MinUserLevel(EUserLevels.ADMIN)
export class MemberMembershipController {
    constructor(private readonly memberMembershipService: MemberMembershipService) { }

    @ApiOperation({ summary: 'Get my membership summary' })
    @ApiResponse({
        status: 200,
        description: 'Returns current membership summary for the logged-in user',
        type: CurrentMembershipSummaryDto,
    })
    @MinUserLevel(EUserLevels.MEMBER)
    @Get('me/membership/summary')
    @MinUserLevel(EUserLevels.MEMBER)
    async getMyMembershipSummary(@AuthUser() currentUser: User): Promise<CurrentMembershipSummaryDto> {
        return this.memberMembershipService.getMyMembershipSummary(currentUser.id);
    }

    @ApiOperation({ summary: 'Get all member memberships for a specific member' })
    @ApiParam({ name: 'memberId', description: 'Member ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns list of member memberships',
        type: [MemberMembershipDto],
    })
    @MinUserLevel(EUserLevels.MEMBER)
    @Get('member/:memberId')
    async getMemberMemberships(
        @Param('memberId') memberId: string,
        @Query() query: MemberMembershipListDto,
    ) {
        return this.memberMembershipService.getAll(
            { ...query, memberId } as any,
            MemberMembershipListDto,
            {
                beforeQuery: (queryBuilder: any) => {
                    queryBuilder.andWhere('entity.memberId = :memberId', { memberId });
                    return queryBuilder;
                },
            },
        );
    }

    @ApiOperation({ summary: 'Get member membership by ID' })
    @ApiParam({ name: 'id', description: 'Member Membership ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns member membership by ID',
        type: MemberMembershipDto,
    })
    @ApiResponse({ status: 404, description: 'Member membership not found' })
    @Get(':id')
    async getMemberMembership(
        @Param('id') id: string,
        @Query() query: SingleQueryDto<MemberMembership>,
    ) {
        const memberMembership = await this.memberMembershipService.getSingle(id, query);
        if (!memberMembership) throw new NotFoundException('Member membership not found');
        return memberMembership;
    }


    @ApiOperation({ summary: 'Get current membership status' })
    @ApiParam({ name: 'id', description: 'Member Membership ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns current membership status from latest history entry',
        type: MemberMembershipStatusDto,
    })
    @Get(':id/status')
    async getMembershipStatus(@Param('id') id: string): Promise<MemberMembershipStatusDto> {
        return this.memberMembershipService.getMemberMembershipStatus(id);
    }

    @ApiOperation({ summary: 'Get current membership summary for a member' })
    @ApiParam({ name: 'memberId', description: 'Member ID' })
    @ApiResponse({
        status: 200,
        description: 'Returns current membership summary with status, dates, and membership details',
        type: CurrentMembershipSummaryDto,
    })
    @MinUserLevel(EUserLevels.MEMBER)
    @Get('member/:memberId/current-summary')
    async getCurrentMembershipSummary(@Param('memberId') memberId: string): Promise<CurrentMembershipSummaryDto> {
        return this.memberMembershipService.getCurrentMembershipSummary(memberId);
    }

    @ApiOperation({ summary: 'Cancel my current membership' })
    @ApiResponse({
        status: 200,
        description: 'Current membership cancelled successfully',
    })
    @MinUserLevel(EUserLevels.MEMBER)
    @Post('me/cancel')
    async cancelMyMembership(@AuthUser() currentUser: User): Promise<IMessageResponse> {
        return this.memberMembershipService.cancelMyMembership(currentUser.id);
    }

    @ApiOperation({ summary: 'Cancel membership for a specific member (Admin only)' })
    @ApiParam({ name: 'memberId', description: 'Member ID' })
    @ApiResponse({
        status: 200,
        description: 'Member membership cancelled successfully',
    })
    @MinUserLevel(EUserLevels.ADMIN)
    @Post('member/:memberId/cancel')
    async cancelMemberMembership(@Param('memberId') memberId: string): Promise<IMessageResponse> {
        return this.memberMembershipService.cancelMemberMembership(memberId);
    }

    @ApiOperation({
        summary: 'Assign membership to a member (Admin only)',
        description: 'Admin assigns a membership to a member with a specific start date. Billing schedules will be created starting from the specified date.'
    })
    @ApiBody({ type: AdminAssignMembershipDto })
    @ApiResponse({
        status: 200,
        description: 'Membership assigned successfully',
    })
    @MinUserLevel(EUserLevels.ADMIN)
    @Post('admin/assign')
    async adminAssignMembership(
        @Body() dto: AdminAssignMembershipDto,
        @Timezone() timezone: string,
    ): Promise<IMessageResponse> {
        return await this.memberMembershipService.adminAssignMembership(dto,timezone,);
        
    }
}

