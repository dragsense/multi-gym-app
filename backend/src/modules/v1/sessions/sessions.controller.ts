import {
  Controller,
  Get,
  UseGuards,
  Body,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Patch,
  ForbiddenException,
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

import { SessionsService } from './sessions.service';
import { MembersService } from '../members/members.service';
import { LinkMemberService } from '../members/services/link-member.service';
import {
  CreateSessionDto,
  UpdateSessionDto,
  UpdateSessionNotesDto,
  SessionListDto,
  SessionPaginatedDto,
  SessionDto,
  SingleQueryDto,
  AvailableSlotsRequestDto,
  AvailableSlotsResponseDto,
  AvailableDatesRequestDto,
  AvailableDatesResponseDto,
  CalendarEventsRequestDto,
} from '@shared/dtos';
import { Session } from './entities/session.entity';
import { AuthUser } from '@/decorators/user.decorator';
import { User } from '@/common/base-user/entities/user.entity';
import { EUpdateSessionScope, EUserLevels } from '@shared/enums';
import { ESubscriptionFeatures } from '@shared/enums/business/subscription.enum';
import { IMessageResponse } from '@shared/interfaces';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { MinUserLevel } from '@/decorators/level.decorator';
import { RequireModule } from '@/decorators/require-module.decorator';
import { Timezone } from '@/decorators/timezone.decorator';
import { Resource } from '@/decorators';
import { EResource } from '@shared/enums';

@ApiBearerAuth('access-token')
@ApiTags('Sessions')
@MinUserLevel(EUserLevels.ADMIN)
@RequireModule(ESubscriptionFeatures.SESSIONS)
@Resource(EResource.SESSIONS)
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly membersService: MembersService,
    private readonly linkMemberService: LinkMemberService,
  ) { }

  @ApiOperation({ summary: 'Get all sessions with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of sessions',
    type: SessionPaginatedDto,
  })
  @Get()
  @MinUserLevel(EUserLevels.MEMBER)
  async findAll(@Query() query: SessionListDto, @AuthUser() currentUser: User) {
    const isAdmin = currentUser.level === EUserLevels.ADMIN;


    return this.sessionsService.get(query, SessionListDto, {
      beforeQuery: (query: SelectQueryBuilder<Session>) => {
        if (!isAdmin) {
          query
            .leftJoin('entity.trainer', '_trainer')
            .leftJoin('entity.members', '_members')
            .andWhere(
              new Brackets((qb2) => {
                qb2
                  .where('entity.createdByUserId = :uid', {
                    uid: currentUser.id,
                  })
                  .orWhere('_trainer.userId = :uid', {
                    uid: currentUser.id,
                  })
                  .orWhere('_members.userId = :uid', {
                    uid: currentUser.id,
                  });


              }),
            );
        }
      },
    });
  }


  @ApiOperation({ summary: 'Get session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns session by ID',
    type: SessionDto,
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Get(':id')
  @MinUserLevel(EUserLevels.MEMBER)
  async findOne(
    @Param('id') id: string,
    @Query() query: SingleQueryDto<Session>,
  ) {
    const idWithDateParts = id.split('@');

    const sessionId = idWithDateParts[0];

    const session = await this.sessionsService.getSingle(sessionId, query);
    if (!session) throw new NotFoundException('Session not found');

    const date = idWithDateParts[1];

    if (!date) {
      return session;
    }

    return this.sessionsService.getCalendarEvent(session, date);
  }

  @ApiOperation({ summary: 'Add a new session' })
  @ApiBody({
    type: CreateSessionDto,
    description: 'Create a new session',
  })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @Post()
  @MinUserLevel(EUserLevels.MEMBER)
  create(
    @Body() createSessionDto: CreateSessionDto,
    @AuthUser() currentUser: User,
    @Timezone() timezone: string,
  ) {
    return this.sessionsService.createSession(
      createSessionDto,
      currentUser,
      timezone,
    );
  }

  @ApiOperation({ summary: 'Update session by ID' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiBody({
    type: UpdateSessionDto,
    description: 'Update session information',
  })
  @ApiResponse({ status: 200, description: 'Session updated successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @AuthUser() currentUser: User,
    @Timezone() timezone: string,
  ) {
    return this.sessionsService.updateSession(
      id,
      updateSessionDto,
      currentUser,
      timezone,
    );
  }

  @ApiOperation({ summary: 'Delete session by ID' })
  @ApiParam({
    name: 'id',
    description: 'Session ID (with optional @date for recurring sessions)',
  })
  @ApiBody({
    type: UpdateSessionDto,
    description: 'Delete session with optional update scope',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query() query: { scope?: EUpdateSessionScope },
  ): Promise<IMessageResponse> {
    return await this.sessionsService.deleteSession(id, query);
  }

  @ApiOperation({ summary: 'Get available time slots for trainer and members' })
  @ApiBody({
    type: AvailableSlotsRequestDto,
    description: 'Request available time slots',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns available time slots',
    type: AvailableSlotsResponseDto,
  })
  @Post('available-slots')
  @MinUserLevel(EUserLevels.MEMBER)
  getAvailableSlots(
    @Body() request: AvailableSlotsRequestDto,
    @AuthUser() currentUser: User,
    @Timezone() timezone: string,
  ) {
    return this.sessionsService.getAvailableSlots(
      request,
      currentUser,
      timezone,
    );
  }

  @ApiOperation({
    summary: 'Get available and unavailable dates for trainer and members',
  })
  @ApiBody({
    type: AvailableDatesRequestDto,
    description: 'Request available dates',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns available and unavailable dates',
    type: AvailableDatesResponseDto,
  })
  @Post('available-dates')
  @MinUserLevel(EUserLevels.MEMBER)
  getAvailableDates(@Body() request: AvailableDatesRequestDto) {
    return this.sessionsService.getAvailableDates(request);
  }

  @ApiOperation({
    summary: 'Get all calendar events (including expanded recurring sessions)',
  })
  @ApiBody({
    type: CalendarEventsRequestDto,
    description: 'Request calendar events for date range',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns array of calendar events',
    type: [SessionDto],
  })
  @Get('calendar/events')
  @MinUserLevel(EUserLevels.MEMBER)
  getCalendarEvents(
    @Query() request: CalendarEventsRequestDto,
    @AuthUser() currentUser: User,
  ): Promise<SessionDto[]> {
    return this.sessionsService.getCalendarEvents(request, currentUser);
  }

  @ApiOperation({ summary: 'Cancel a session' })
  @ApiParam({
    name: 'id',
    description: 'Session ID (with optional @date for recurring sessions)',
  })
  @ApiResponse({ status: 200, description: 'Session cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Patch('cancel/:id')
  async cancelSession(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Timezone() timezone: string,
  ) {
    return this.sessionsService.cancelSession(id, timezone, body?.reason);
  }

  @ApiOperation({ summary: 'Reactivate a cancelled session' })
  @ApiParam({
    name: 'id',
    description: 'Session ID (with optional @date for recurring sessions)',
  })
  @ApiResponse({ status: 200, description: 'Session reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Patch('reactivate/:id')
  async reactivateSession(
    @Param('id') id: string,
    @Timezone() timezone: string,
  ) {
    return this.sessionsService.reactivateSession(id, timezone);
  }

  @ApiOperation({ summary: 'Mark a session as completed' })
  @ApiParam({
    name: 'id',
    description: 'Session ID (with optional @date for recurring sessions)',
  })
  @ApiResponse({ status: 200, description: 'Session marked completed' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Patch('complete/:id')
  async completeSession(@Param('id') id: string) {
    return this.sessionsService.completeSession(id);
  }

  @ApiOperation({ summary: 'Update session notes' })
  @ApiParam({
    name: 'id',
    description: 'Session ID (with optional @date for recurring sessions)',
  })
  @ApiBody({
    type: UpdateSessionNotesDto,
    description: 'Update session notes',
  })
  @ApiResponse({
    status: 200,
    description: 'Session notes updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @Patch('notes/:id')
  @MinUserLevel(EUserLevels.MEMBER)
  async updateSessionNotes(
    @Param('id') id: string,
    @Body() updateNotesDto: UpdateSessionNotesDto,
  ) {
    return this.sessionsService.updateSessionNotes(id, updateNotesDto);
  }

  @ApiOperation({ summary: 'Get recent sessions with calendar events for a member' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns recent sessions with calendar events',
    type: [SessionDto],
  })
  @Get('member/:memberId/events')
  async getRecentSessionsWithCalendarEvents(
    @Param('memberId') memberId: string,
    @Query() request: CalendarEventsRequestDto,
    @AuthUser() currentUser: User,
  ) {

    const isMember = currentUser.level === EUserLevels.MEMBER;
    if (isMember) {
      const linkedMember = await this.linkMemberService.findOne(memberId, currentUser, {
        _relations: ['linkedMember'],
      });
      if (!linkedMember?.linkedMember) throw new NotFoundException('Linked member not found');
      if (linkedMember.linkedMember.id !== memberId || linkedMember.viewSessionCheck !== true) throw new ForbiddenException('You do not have access to view these sessions');
    }

    return this.sessionsService.getCalendarEvents(
      request,
      currentUser,
      undefined,
      memberId,
    );
  }

  @ApiOperation({ summary: 'Get recent sessions with calendar events for a trainer' })
  @ApiParam({ name: 'trainerId', description: 'Trainer ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns recent sessions with calendar events',
    type: [SessionDto],
  })
  @Get('trainer/:trainerId/events')
  async getTrainerSessionsWithCalendarEvents(
    @Param('trainerId') trainerId: string,
    @Query() request: CalendarEventsRequestDto,
    @AuthUser() currentUser: User,
  ) {
    return this.sessionsService.getCalendarEvents(
      request,
      currentUser,
      trainerId,
      undefined,
    );
  }

  @ApiOperation({ summary: 'Get my upcoming sessions (for current logged-in user - trainer or member)' })
  @ApiResponse({
    status: 200,
    description: 'Returns upcoming sessions for current user based on their level (trainer or member)',
    type: [SessionDto],
  })
  @Get('me/events')
  @MinUserLevel(EUserLevels.MEMBER)
  async getMySessionsWithCalendarEvents(
    @Query() request: CalendarEventsRequestDto,
    @AuthUser() currentUser: User,
  ) {
    return this.sessionsService.getMyCalendarEvents(request, currentUser);
  }
}
