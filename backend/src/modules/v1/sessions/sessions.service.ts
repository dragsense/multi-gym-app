import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  In,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
  SelectQueryBuilder,
  DataSource,
} from 'typeorm';
import { ModuleRef } from '@nestjs/core';

import { Session } from './entities/session.entity';
import { OverrideRecurrenceSession } from './entities/override-recurrence-session.entity';
import {
  MemberListDto,
  CreateSessionDto,
  SessionListDto,
  RecurrenceConfigDto,
  UpdateSessionDto,
} from '@shared/dtos';
import { IMessageResponse } from '@shared/interfaces';
import { LoggerService } from '@/common/logger/logger.service';
import { CrudService } from '@/common/crud/crud.service';
import { CrudOptions } from '@/common/crud/interfaces/crud.interface';
import {
  EUpdateSessionScope,
  EUserLevels,
  ESessionStatus,
} from '@shared/enums';
import { StaffService } from '../staff/staff.service';
import { MembersService } from '../members/members.service';
import { LinkMemberService } from '../members/services/link-member.service';
import { User } from '@/common/base-user/entities/user.entity';
import { Member } from '../members/entities/member.entity';
import { UserSettingsService } from '../user-settings/user-settings.service';
import { SessionMiscService } from './services/session-misc.service'   ////Newley added service to put checck on delete billing 
import { Between } from 'typeorm';
import {
  AvailableSlotsRequestDto,
  AvailableSlotsResponseDto,
  AvailableTimeSlotDto,
  AvailableDatesRequestDto,
  AvailableDatesResponseDto,
  UnavailableDateRangeDto,
  CalendarEventsRequestDto,
  SessionDto,
  UpdateSessionNotesDto,
} from '@shared/dtos/session-dtos';
import {
  DayScheduleDto,
  UserAvailabilityDto,
} from '@shared/dtos/user-availability-dtos';
import { DateTime } from 'luxon';
import { Staff } from '../staff/entities/staff.entity';
import { ServiceOffer } from '../service-offers/entities/service-offer.entity';
import { EScheduleFrequency, EDayOfWeek } from '@shared/enums/schedule.enum';
import { plainToInstance } from 'class-transformer';
import { RRule, Frequency, Options } from 'rrule';
import { UserAvailabilityService } from '../user-availability/user-availability.service';
import { EntityRouterService } from '@/common/database/entity-router.service';
import { LocationsService } from '../locations/services/locations.service';
import { ServiceOffersService } from '../service-offers/services/service-offers.service';
import { EServiceOfferStatus } from '@shared/enums/service-offer.enum';

@Injectable()
export class SessionsService extends CrudService<Session> {
  private readonly customLogger = new LoggerService(SessionsService.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    protected readonly entityRouterService: EntityRouterService,
    private readonly userAvailabilityService: UserAvailabilityService,
    private readonly staffService: StaffService,
    private readonly membersService: MembersService,
    private readonly linkMemberService: LinkMemberService,
    private readonly userSettingsService: UserSettingsService,
    private readonly sessionmMiscService: SessionMiscService, //Newley added service to put checck on delete billing 
    private readonly locationsService: LocationsService,
    private readonly serviceOffersService: ServiceOffersService,
    moduleRef: ModuleRef,
  ) {
    const crudOptions: CrudOptions = {
      restrictedFields: ['staff.user.password', 'members.user.password'],
      searchableFields: ['title', 'description', 'location', 'notes'],
    };
    super(sessionRepo, moduleRef, crudOptions);
  }

  async createSession(
    createSessionDto: CreateSessionDto & { parent?: Partial<Session> },
    currentUser: User,
    timezone: string,
  ): Promise<IMessageResponse & { session: Session }> {


    const isMember = currentUser.level === EUserLevels.MEMBER;

    if (isMember) {
      if (!createSessionDto.serviceOffer?.id)
        throw new BadRequestException('Service offer is required for sessions.');

      createSessionDto.price = undefined;
      createSessionDto.enableRecurrence = false;
      createSessionDto.recurrenceConfig = undefined;
      createSessionDto.recurrenceEndDate = undefined;
      createSessionDto.reminderConfig = undefined;
      createSessionDto.enableReminder = false;
      createSessionDto.useCustomPrice = false;
    }

    // Get trainer and members using reusable helper functions
    const trainer = await this.getTrainer(
      currentUser,
      createSessionDto.trainer?.id,
      undefined,
    );

    const memberIds = createSessionDto.members.map((c) => c.id);
    const membersResult = await this.getMembers(
      memberIds,
    );

    const trainerUserId = trainer.user.id;
    const trainerSettings = trainerUserId
      ? await this.userSettingsService.getUserSettings(trainerUserId)
      : null;

    // Validate session limits
    if (trainerSettings?.limits) {
      const limits = trainerSettings.limits;

      // Check maxMembersPerSession
      if (
        limits.maxMembersPerSession &&
        createSessionDto.members.length > limits.maxMembersPerSession
      ) {
        throw new BadRequestException(
          `Maximum ${limits.maxMembersPerSession} members allowed per session. You selected ${createSessionDto.members.length} members.`,
        );
      }

      // Check maxSessionsPerDay
      if (limits.maxSessionsPerDay) {
        const sessionDate = DateTime.fromISO(createSessionDto.startDateTime);
        const startOfDay = sessionDate.startOf('day');
        const endOfDay = sessionDate.plus({ days: 1 }).startOf('day');

        const repository = this.getRepository();
        const sessionsToday = await repository.count({
          where: {
            trainer: { id: trainer.id },
            startDateTime: Between(startOfDay.toJSDate(), endOfDay.toJSDate()),
          },
        });

        if (sessionsToday >= limits.maxSessionsPerDay) {
          throw new BadRequestException(
            `Maximum ${limits.maxSessionsPerDay} sessions allowed per day. You already have ${sessionsToday} sessions scheduled for this day.`,
          );
        }
      }

      // Check maxSessionDuration
      if (
        limits.maxSessionDuration &&
        createSessionDto.duration > limits.maxSessionDuration
      ) {
        throw new BadRequestException(
          `Maximum ${limits.maxSessionDuration} minutes allowed per session. You selected ${createSessionDto.duration} minutes.`,
        );
      }
    }

    const sessionStartTime = createSessionDto.startDateTime;
    const validation = await this.validateSessionTimeAvailability(
      currentUser,
      trainer.id,
      memberIds,
      sessionStartTime,
      createSessionDto.duration,
      timezone,
    );

    if (!validation.isValid) {
      throw new BadRequestException(
        validation.reason || 'Session time is not available',
      );
    }

    const frequency = createSessionDto.recurrenceConfig?.frequency;

    if (
      frequency === EScheduleFrequency.ONCE ||
      createSessionDto.enableRecurrence === false
    ) {
      createSessionDto.recurrenceConfig = undefined;
      createSessionDto.enableRecurrence = false;
    }

    if (
      createSessionDto.enableRecurrence &&
      !createSessionDto.recurrenceEndDate
    ) {
      throw new BadRequestException(
        'Recurrence end date is required when recurrence is enabled',
      );
    }

    // Handle price logic: if useCustomPrice is true, use customPrice, otherwise calculate from service offer
    let finalPrice = 0;
    if (createSessionDto.useCustomPrice && createSessionDto.customPrice !== undefined) {
      finalPrice = createSessionDto.customPrice;
    } else if (createSessionDto.serviceOffer?.id) {
      // Calculate price from service offer
      const serviceOffer = await this.serviceOffersService.getSingle(createSessionDto.serviceOffer.id);
      if (!serviceOffer || serviceOffer.status == EServiceOfferStatus.INACTIVE) {
        throw new BadRequestException('Service offer not found or inactive');
      }
      // discount is in percentage
      const discountPercent = Number(serviceOffer.discount) || 0;
      finalPrice = Number(serviceOffer.offerPrice);
      if (discountPercent > 0) {
        finalPrice = finalPrice - (finalPrice * discountPercent / 100);
      }
    }

    // Validate location if provided
    if (createSessionDto.location?.id) {
      const location = await this.locationsService.getSingle(createSessionDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    const session = await this.create({
      ...createSessionDto,
      trainer: { id: trainer.id },
      members: membersResult.map((c) => ({ id: c.id })),
      serviceOfferId: createSessionDto.serviceOffer?.id,
      ...(createSessionDto.location?.id ? {
        location: {
          id: createSessionDto.location.id,
        },
      } : {}),
      price: finalPrice,
    });

    return { message: 'Session created successfully.', session };
  }

  async updateSession(
    id: string,
    updateSessionDto: UpdateSessionDto & { notes?: string },
    currentUser: User,
    timezone: string,
  ): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');

    const sessionId = idWithDateParts[0];

    // Get existing session to determine trainer
    const existingSession = await this.getSingle(sessionId, {
      _relations: ['trainer', 'members'],
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    if (updateSessionDto.enableRecurrence !== undefined) {
      throw new BadRequestException(
        'Cannot update the recurrence status. Please delete the session and create a new one.',
      );
    }

    const date = idWithDateParts[1];

    if (existingSession.enableRecurrence && !updateSessionDto.updateScope) {
      throw new BadRequestException(
        'Update scope is required for recurring sessions',
      );
    }

    // Get trainer and members using reusable helper functions
    const trainer = await this.getTrainer(
      currentUser,
      updateSessionDto.trainer?.id,
      existingSession,
    );

    if (updateSessionDto.trainer) {
      updateSessionDto.trainer = { id: trainer.id };
    }

    let finalPrice: number | undefined = undefined;
    if ((updateSessionDto.useCustomPrice || existingSession.useCustomPrice) && updateSessionDto.customPrice !== undefined) {
      finalPrice = updateSessionDto.customPrice;
    } else if (updateSessionDto.serviceOffer?.id) {
      // Calculate price from service offer
      const serviceOfferRepo = this.dataSource.getRepository(ServiceOffer);
      const serviceOffer = await serviceOfferRepo.findOne({ where: { id: updateSessionDto.serviceOffer.id } });
      if (serviceOffer && serviceOffer.offerPrice) {
        const discountAmount = (Number(serviceOffer.offerPrice) * (Number(serviceOffer.discount) || 0)) / 100;
        finalPrice = Number(serviceOffer.offerPrice) - discountAmount;
      }
    }

    let memberIds: string[] = existingSession.members?.map((c) => c.id) || [];

    if (updateSessionDto.members && updateSessionDto.members.length > 0) {
      const memberIdsFromDto = updateSessionDto.members.map((c) => c.id);
      const members = await this.getMembers(
        memberIdsFromDto,
        existingSession.members,
      );

      memberIds = members.map((c) => c.id);
      updateSessionDto.members = members.map((c) => ({ id: c.id }));
    }

    if (updateSessionDto.startDateTime) {
      const now = DateTime.now();
      const sessionStartTimeDT = DateTime.fromISO(
        updateSessionDto.startDateTime,
      );

      if (sessionStartTimeDT < now) {
        throw new BadRequestException(
          'Session start time cannot be in the past',
        );
      }

      const sessionStartTime = updateSessionDto.startDateTime;

      const validation = await this.validateSessionTimeAvailability(
        currentUser,
        trainer.id,
        memberIds,
        sessionStartTime,
        updateSessionDto.duration || existingSession.duration || 60,
        timezone,
        existingSession.id, // Exclude current session from conflict check
      );

      if (!validation.isValid) {
        throw new BadRequestException(
          validation.reason || 'Session time is not available',
        );
      }

      updateSessionDto.status = ESessionStatus.RESCHEDULED;

      const formattedDate = DateTime.now()
        .setZone(timezone)
        .toFormat('yyyy-MM-dd HH:mm');
      const dateTimeChangeNote = `\n\n--- Session Rescheduled (${formattedDate}) ---\nReason: ${updateSessionDto.dateChangeReason || 'No reason provided'}\n`;
      updateSessionDto.notes = dateTimeChangeNote;
    }

    if (date && existingSession.enableRecurrence) {
      const dateDT = DateTime.fromISO(date);

      if (!dateDT.isValid) {
        throw new BadRequestException('Invalid date');
      }

      if (updateSessionDto.updateScope !== EUpdateSessionScope.ALL) {
        if (updateSessionDto.startDateTime) {
          if (updateSessionDto.notes) {
            existingSession.notes =
              (existingSession.notes || '') + updateSessionDto.notes;
          }
          await this.createRuccrenceSingleSession(
            existingSession,
            date,
            ESessionStatus.RESCHEDULED,
            updateSessionDto.startDateTime,
          );

          return { message: 'Session rescheduled successfully' };
        } else
          return await this.createOrUpdateOverride(existingSession, date, {
            ...updateSessionDto,
            price: finalPrice,
            enableRecurrence: undefined,
            recurrenceConfig: undefined,
            recurrenceEndDate: undefined,
          });
      }
    }

    if (updateSessionDto.enableRecurrence !== undefined) {
      throw new BadRequestException(
        'Cannot update the recurrence status. Please delete the session and create a new one.',
      );
    }

    const trainerUserId = trainer.user.id;
    const trainerSettings = trainerUserId
      ? await this.userSettingsService.getUserSettings(trainerUserId)
      : null;

    // Validate session limits
    if (trainerSettings?.limits) {
      const limits = trainerSettings.limits;

      // Check maxMembersPerSession if members are being updated
      if (updateSessionDto.members) {
        if (
          limits.maxMembersPerSession &&
          updateSessionDto.members.length > limits.maxMembersPerSession
        ) {
          throw new BadRequestException(
            `Maximum ${limits.maxMembersPerSession} members allowed per session. You selected ${updateSessionDto.members.length} members.`,
          );
        }
      }

      // Check maxSessionDuration if duration is being updated
      const duration = updateSessionDto.duration;
      if (limits.maxSessionDuration && duration) {
        if (duration > limits.maxSessionDuration) {
          throw new BadRequestException(
            `Maximum ${limits.maxSessionDuration} minutes allowed per session. You selected ${duration} minutes.`,
          );
        }
      }
    }

    if (updateSessionDto.recurrenceConfig) {
      const existing =
        existingSession.recurrenceConfig || ({} as RecurrenceConfigDto);
      const incoming = updateSessionDto.recurrenceConfig;

      const recurrenceConfig: RecurrenceConfigDto = { ...existing };

      for (const key of Object.keys(incoming)) {
        if (incoming[key] !== undefined) {
          recurrenceConfig[key] = incoming[key];
        }
      }

      updateSessionDto.recurrenceConfig = recurrenceConfig;

      if (recurrenceConfig.frequency != existing.frequency) {
        updateSessionDto.status = ESessionStatus.RESCHEDULED;
      }
    }

    if (updateSessionDto.reminderConfig) {
      const existing = existingSession.reminderConfig || {};
      const incoming = updateSessionDto.reminderConfig;
      const reminderConfig: any = { ...existing };
      for (const key of Object.keys(incoming)) {
        if (incoming[key] !== undefined) {
          reminderConfig[key] = incoming[key];
        }
      }
      updateSessionDto.reminderConfig = reminderConfig;
    }

    if (updateSessionDto.notes) {
      updateSessionDto.notes =
        (existingSession.notes || '') + updateSessionDto.notes;
    }

    // Validate location if provided
    if (updateSessionDto.location?.id) {
      const location = await this.locationsService.getSingle(updateSessionDto.location.id);
      if (!location) {
        throw new NotFoundException('Location not found');
      }
    }

    await this.update(existingSession.id, updateSessionDto, {
      beforeUpdate: async () => {
        await this.checkActualSessionsAndCreate(existingSession);
        // Return the updateDto to ensure it's used for the update
        return {
          ...updateSessionDto,
          price: finalPrice,
          ...(updateSessionDto.location?.id ? {
            location: {
              id: updateSessionDto.location.id,
            },
          } : {}),
        };
      },
      afterUpdate: async () => {
        // Instead of deleting overrides, update only the fields that were changed
        const overrideRepo = this.entityRouterService.getRepository<OverrideRecurrenceSession>(OverrideRecurrenceSession);
        const allOverrides = await overrideRepo.find({
          where: {
            session: { id: existingSession.id },
            isDeleted: false,
          },
          relations: ['session'],
        });

        for (const override of allOverrides) {
          const { updatedOverrideData, updatedOverride } =
            this.updateOverrideFields(override, updateSessionDto);

          // Update the override with the new data
          override.overrideData = updatedOverrideData;
          Object.assign(override, updatedOverride);
          await overrideRepo.save(override);
        }
      },
    });

    return { message: 'Session updated successfully' };
  }

  async updateSessionNotes(
    id: string,
    updateNotesDto: UpdateSessionNotesDto,
  ): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');
    const sessionId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const existingSession = await this.getSingle(sessionId, {
      _relations: ['trainer', 'members'],
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    if (!updateNotesDto.updateScope) {
      throw new BadRequestException(
        'Update scope is required for recurring sessions',
      );
    }

    if (updateNotesDto.notes !== undefined) {
      if (date && existingSession.enableRecurrence) {
        if (updateNotesDto.updateScope === EUpdateSessionScope.THIS) {
          const overrideDto: any = {
            notes: updateNotesDto.notes,
            updateScope: updateNotesDto.updateScope || EUpdateSessionScope.THIS,
          };
          await this.createOrUpdateOverride(existingSession, date, overrideDto);
        }
      } else if (updateNotesDto.updateScope === EUpdateSessionScope.ALL) {
        await this.update(existingSession.id, {
          notes: updateNotesDto.notes,
        });
      }
    }

    return { message: 'Session notes updated successfully' };
  }

  async getAvailableDates(
    request: AvailableDatesRequestDto,
    returnAvailabilityData: boolean = false,
  ): Promise<
    AvailableDatesResponseDto & {
      trainerAvailability?: UserAvailabilityDto | null;
      memberAvailabilities?: (UserAvailabilityDto | null)[];
    }
  > {
    const { trainerId, memberIds } = request;

    const trainerAvailability = await this.getTrainerAvailability(trainerId);
    const memberAvailabilities = await this.getMemberAvailabilities(memberIds);

    // Calculate off days (days of week that are unavailable)
    const offDaysSet = new Set<string>();
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;

    // Check trainer's off days
    dayNames.forEach((dayName) => {
      const trainerDaySchedule: DayScheduleDto | undefined =
        trainerAvailability?.weeklySchedule?.[
        dayName as keyof typeof trainerAvailability.weeklySchedule
        ];

      if (
        !trainerDaySchedule?.enabled ||
        !trainerDaySchedule?.timeSlots?.length
      ) {
        offDaysSet.add(dayName);
      }
    });

    // Check members' off days - if any member has a day disabled, it's an off day
    dayNames.forEach((dayName) => {
      // Check if all members are not available (the day is off for all members)
      const allMembersDisabled =
        memberAvailabilities.length > 0 &&
        memberAvailabilities.every((memberAvail) => {
          if (!memberAvail) return false; // If no availability set, assume available
          const memberDaySchedule =
            memberAvail.weeklySchedule?.[
            dayName as keyof typeof memberAvail.weeklySchedule
            ];
          return !memberDaySchedule?.enabled;
        });

      if (allMembersDisabled) {
        offDaysSet.add(dayName);
      }
    });

    const offDays = Array.from(offDaysSet);

    // Get unavailable date ranges from unavailable periods
    const unavailableRanges: UnavailableDateRangeDto[] = [];

    // Get ranges from trainer's unavailable periods
    if (trainerAvailability?.unavailablePeriods) {
      trainerAvailability.unavailablePeriods.forEach((period) => {
        if (!period.dateRange || !Array.isArray(period.dateRange)) return;
        if (period.dateRange[0] === null) return;
        unavailableRanges.push({
          startDate: period.dateRange[0],
          endDate: period.dateRange[1] || period.dateRange[0],
        });
      });
    }

    // Get ranges from members' unavailable periods
    // Process member unavailable periods: Only add to unavailableRanges if ALL members have the same unavailable date range
    const memberUnavailableRanges: { startDate: string; endDate: string }[] =
      [];

    // Collect each unique unavailable range from each member
    memberAvailabilities.forEach((memberAvail) => {
      if (!memberAvail?.unavailablePeriods) return;

      memberAvail.unavailablePeriods.forEach((period) => {
        if (!period.dateRange || !Array.isArray(period.dateRange)) return;
        if (period.dateRange[0] === null) return;
        memberUnavailableRanges.push({
          startDate: period.dateRange[0],
          endDate: period.dateRange[1] || period.dateRange[0],
        });
      });
    });

    if (memberAvailabilities.length > 0 && memberUnavailableRanges.length > 0) {
      // Check if all member unavailable ranges are the same (by startDate and endDate)
      const allSame =
        memberUnavailableRanges.every(
          (range) =>
            range.startDate === memberUnavailableRanges[0].startDate &&
            range.endDate === memberUnavailableRanges[0].endDate,
        ) && memberUnavailableRanges.length === memberAvailabilities.length;

      if (allSame) {
        // Only if ALL have exactly the same unavailable range, add to unavailableRanges
        unavailableRanges.push({ ...memberUnavailableRanges[0] });
      }
      // Otherwise, do not add any member unavailable period to unavailableRanges!
    }

    if (returnAvailabilityData) {
      return {
        offDays,
        unavailableRanges,
        trainerAvailability,
        memberAvailabilities,
      };
    }

    return {
      offDays,
      unavailableRanges,
    };
  }

  async getAvailableSlots(
    request: AvailableSlotsRequestDto,
    currentUser: User,
    timezone: string,
    excludeSessionId?: string,
  ): Promise<AvailableSlotsResponseDto> {
    const { trainerId, memberIds, date, duration } = request;

    const trainerSettings = await this.userSettingsService.getUserSettings(
      trainerId,
    );

    const slotStepMinutes = Math.max(trainerSettings?.limits?.slotStepMinutes ?? 15, 1) || 15;

    const slotStepDuration = duration ? duration : slotStepMinutes;


    // First check if the date is available using getAvailableDates
    const { offDays, unavailableRanges, trainerAvailability } =
      await this.getAvailableDates(
        {
          trainerId,
          memberIds,
        },
        true,
      );

    const targetDateDT = DateTime.fromISO(date, {
      zone: timezone,
    });

    const { isOffDay, dayName } = this.checkIsOffDay(targetDateDT, offDays);
    if (isOffDay) {
      return { slots: [], date };
    }

    const isInUnavailableRange = this.checkUnavailablePeriod(
      targetDateDT,
      unavailableRanges,
    );
    if (isInUnavailableRange) {
      return { slots: [], date };
    }

    // Get conflicting sessions (excluding current session if provided)
    const conflictingTimeSlots =
      await this.getTrainerAndAllMembersConflictingSessions(
        currentUser,
        trainerId,
        memberIds,
        targetDateDT,
        excludeSessionId,
      );

    // Check if the target date is today in the specified timezone
    const nowInTimezone = DateTime.now().setZone(timezone);
    const isToday = targetDateDT.hasSame(nowInTimezone, 'day');
    const now = isToday ? nowInTimezone.toJSDate() : null;

    // Find intersection of all available time slots
    const availableSlots: AvailableTimeSlotDto[] = [];

    const trainerDaySchedule =
      trainerAvailability?.weeklySchedule?.[
      dayName as keyof typeof trainerAvailability.weeklySchedule
      ];

    // Start with trainer's available slots
    for (const trainerSlot of trainerDaySchedule?.timeSlots || []) {
      const [startHour, startMinute] = trainerSlot.start.split(':').map(Number);
      const [endHour, endMinute] = trainerSlot.end.split(':').map(Number);

      const slotStart = targetDateDT
        .set({
          hour: startHour,
          minute: startMinute,
          second: 0,
          millisecond: 0,
        })
        .toJSDate();

      const slotEnd = targetDateDT
        .set({
          hour: endHour,
          minute: endMinute,
          second: 0,
          millisecond: 0,
        })
        .toJSDate();

      // Generate time slots based on duration using DateTime
      let currentTime = DateTime.fromJSDate(slotStart);
      const slotEndDT = DateTime.fromJSDate(slotEnd);

      while (
        currentTime.plus({ minutes: slotStepDuration }).toMillis() <=
        slotEndDT.toMillis()
      ) {
        const slotStartTime = currentTime.toJSDate();
        const slotEndTime = this.calculateEndDateTime(
          currentTime,
          slotStepDuration,
        ).toJSDate();

        // If date is today, skip slots that are in the past
        if (isToday && now && slotStartTime < now) {
          // Move to next slot
          currentTime = this.calculateEndDateTime(
            currentTime,
            slotStepMinutes,
          );
          continue;
        }

        // Check if this slot conflicts with any existing sessions
        const hasConflict = conflictingTimeSlots.some((conflict) => {
          const startDateTime = new Date(conflict.startDateTime);
          const endDateTime = new Date(conflict.endDateTime!);

          return (
            (slotStartTime >= startDateTime && slotStartTime < endDateTime) ||
            (slotEndTime > startDateTime && slotEndTime <= endDateTime) ||
            (slotStartTime <= startDateTime && slotEndTime >= endDateTime)
          );
        });

        if (!hasConflict) {
          availableSlots.push({
            startTime: slotStartTime.toISOString(),
            endTime: slotEndTime.toISOString(),
          });
        }

        // Move to next slot (increment by duration)
        currentTime = this.calculateEndDateTime(
          currentTime,
          slotStepDuration,
        );
      }
    }

    return {
      slots: availableSlots,
      date,
    };
  }

  async getCalendarEvents(
    requestDto: CalendarEventsRequestDto,
    currentUser: User,
    trainerId?: string,
    memberId?: string,
    excludeSessionId?: string,
  ): Promise<SessionDto[]> {
    const isAdmin =
      currentUser.level === (EUserLevels.ADMIN as number);

    const { statuses, startDate, endDate, limit } = requestDto;

    // Use CrudService getAll method
    const sessions = await this.getAll(
      {
        _relations: ['trainer', 'overrides', 'members'],
      },
      CalendarEventsRequestDto,
      {
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

          if (trainerId)
            query.andWhere('trainer.id = :trainerId', {
              trainerId,
            });

          if (memberId) {
            query.leftJoin('entity.members', '_members');
            query.andWhere('_members.id = :memberId', {
              memberId,
            });
          }

          if (excludeSessionId)
            query.andWhere('entity.id != :excludeSessionId', {
              excludeSessionId,
            });

          query.andWhere(
            new Brackets((qb) => {
              qb.where('entity.startDateTime BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
              }).orWhere(
                `entity.enableRecurrence = true
                AND entity.recurrenceEndDate IS NOT NULL
                AND entity.recurrenceEndDate >= :startDate
                AND entity.startDateTime <= :endDate`,
                {
                  startDate,
                  endDate,
                },
              );
            }),
          );
          return query;
        },
      },
    );

    const calendarEvents: SessionDto[] = [];

    for (const session of sessions) {
      const expandedSessions: SessionDto[] = await this.expandRecurringSession(
        session,
        startDate,
        endDate,
        statuses,
      );
      calendarEvents.push(...expandedSessions);
    }
    // Convert to SessionDto array
    return limit ? calendarEvents.slice(0, limit) : calendarEvents;
  }

  async getCalendarEvent(session: Session, date: string): Promise<SessionDto> {
    let startDateTime = DateTime.fromISO(date);

    const sessionObject: Partial<Session & { additionalNotes?: string }> = {
      ...session,
      startDateTime: new Date(date),
      id: `${session.id}@${date}`,
    };

    const overrideRepo = this.entityRouterService.getRepository<OverrideRecurrenceSession>(OverrideRecurrenceSession);
    let overrideSession: OverrideRecurrenceSession | null =
      await overrideRepo.findOne({
        where: {
          session: { id: session.id },
          date: new Date(date),
          updateScope: EUpdateSessionScope.THIS,
        },
        relations: ['trainer', 'members', 'trainer.user', 'members.user'],
      });

    if (overrideSession && overrideSession.startDateTime) {
      startDateTime = DateTime.fromJSDate(overrideSession.startDateTime);
      sessionObject.startDateTime = startDateTime.toJSDate();
    }

    if (!overrideSession) {
      const overrideRepo = this.entityRouterService.getRepository<OverrideRecurrenceSession>(OverrideRecurrenceSession);
      const latestOverride = await overrideRepo.find({
        where: {
          session: { id: session.id },
          updateScope: EUpdateSessionScope.THIS_AND_FOLLOWING,
          date: LessThanOrEqual(DateTime.fromISO(date).endOf('day').toJSDate()),
        },
        relations: ['trainer', 'members', 'trainer.user', 'members.user'],
        order: { date: 'DESC' },
        take: 1,
      });
      overrideSession =
        latestOverride && latestOverride.length > 0 ? latestOverride[0] : null;
    }

    if (overrideSession) {
      const overrideData = overrideSession.overrideData;
      if (overrideData) {
        Object.assign(sessionObject, overrideData);
      }
      sessionObject.trainer = overrideSession.trainer
        ? ({
          id: overrideSession.trainer.id,
          user: overrideSession.trainer.user,
          specialization: overrideSession.trainer.specialization,
          experience: overrideSession.trainer.experience,
        } as Staff)
        : session.trainer; 
      sessionObject.members =
        overrideSession.members && overrideSession.members.length > 0
          ? overrideSession.members.map(
            (member) =>
              ({
                id: member.id,
                user: member.user,
              }) as Member,
          )
          : session.members;

      sessionObject.status = overrideSession.status;

      sessionObject.additionalNotes = overrideSession.notes;
    }

    const endDateTime = this.calculateEndDateTime(
      startDateTime,
      sessionObject.duration || 60,
    );
    return plainToInstance(
      SessionDto,
      {
        ...sessionObject,
        endDateTime: endDateTime.toISO(),
        enableRecurrence: false,
        recurrenceConfig: session.recurrenceConfig,
      },
      {
        excludeExtraneousValues: false,
      },
    );
  }

  async cancelSession(
    id: string,
    timezone: string,
    reason?: string,
  ): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');
    const sessionId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const existingSession = await this.getSingle(sessionId, {
      _relations: ['trainer', 'members'],
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    // Format the cancellation note with date and reason
    const now = DateTime.now().setZone(timezone);
    const formattedDate = now.toFormat('yyyy-MM-dd HH:mm');
    const cancellationNote = `\n\n--- Session Cancelled (${formattedDate}) ---\nReason: ${reason || 'No reason provided'}\n`;

    // If it's a recurring session and date is provided, create an override
    if (date && existingSession.enableRecurrence) {
      const sessionDateTime = DateTime.fromISO(date);
      if (!sessionDateTime.isValid) {
        throw new BadRequestException(
          'Invalid date for creating an individual session after cancellation.',
        );
      }

      existingSession.notes = (existingSession.notes || '') + cancellationNote;
      await this.createRuccrenceSingleSession(
        existingSession,
        date,
        ESessionStatus.CANCELLED,
      );

      return {
        message: 'Session cancelled for this date.',
      };
    }

    // Check if session is already cancelled or completed
    if (existingSession.status === ESessionStatus.CANCELLED) {
      throw new BadRequestException('Session is already cancelled');
    }

    // For non-recurring or ALL scope, update the main session
    const updatedNotes = (existingSession.notes || '') + cancellationNote;
    await this.update(sessionId, {
      status: ESessionStatus.CANCELLED,
      notes: updatedNotes,
    } as UpdateSessionDto);

    return { message: 'Session cancelled successfully' };
  }

  async completeSession(id: string): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');
    const sessionId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const existingSession = await this.getSingle(sessionId, {
      _relations: ['trainer', 'members'],
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    const now = new Date();
    if (
      existingSession.startDateTime >= now ||
      (date && new Date(date) >= now)
    ) {
      throw new BadRequestException(
        'Cannot complete a session that has not started yet',
      );
    }

    if (date && existingSession.enableRecurrence) {
      const sessionDateTime = DateTime.fromISO(date);
      if (!sessionDateTime.isValid) {
        throw new BadRequestException(
          'Invalid date for creating an individual session after completion.',
        );
      }

      try {
        const isAlreadyCreated = await this.getSingle(
          {
            parentId: existingSession.id,
            startDateTime: sessionDateTime.toJSDate(),
          },
          {
            _relations: ['trainer', 'members'],
          },
        );

        if (isAlreadyCreated) {
          return this.completeSession(isAlreadyCreated.id);
        }
      } catch (error) {
        console.log(error);
      }

      await this.createRuccrenceSingleSession(
        existingSession,
        date,
        ESessionStatus.COMPLETED,
      );

      return {
        message: 'Session completed for this date.',
      };
    }

    if (existingSession.status === ESessionStatus.COMPLETED) {
      throw new BadRequestException('Session is already completed');
    }

    await this.update(sessionId, {
      status: ESessionStatus.COMPLETED,
    } as UpdateSessionDto);

    return { message: 'Session marked as completed successfully' };
  }

  async reactivateSession(
    id: string,
    timezone: string,
  ): Promise<IMessageResponse> {
    const existingSession = await this.getSingle(id, {
      _relations: ['trainer', 'members'],
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }
    const now = DateTime.now().setZone(timezone);
    const formattedDate = now.toFormat('yyyy-MM-dd HH:mm');
    const reactivationNote = `\n\n--- Session Reactivated (${formattedDate}) ---\n`;

    if (
      existingSession.startDateTime <= new Date() ||
      (existingSession.endDateTime && existingSession.endDateTime <= new Date())
    ) {
      throw new BadRequestException(
        'Cannot reactivate a session that has already started or ended',
      );
    }

    // Check if session is cancelled
    if (existingSession.status !== ESessionStatus.CANCELLED) {
      throw new BadRequestException('Session is not cancelled');
    }

    const status: ESessionStatus = ESessionStatus.RESCHEDULED;

    const updatedNotes = (existingSession.notes || '') + reactivationNote;

    // For non-recurring sessions, update the main session status
    await this.update(id, {
      status: status,
      notes: updatedNotes,
    } as UpdateSessionDto);

    return { message: 'Session reactivated successfully' };
  }

  async createActualSession(
    id: string,
    status: ESessionStatus,
  ): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');
    const sessionId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const existingSession = await this.getSingle(sessionId, {
      _relations: ['trainer', 'members'],
    });

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    if (date && existingSession.enableRecurrence) {
      const sessionDateTime = DateTime.fromISO(date);
      if (!sessionDateTime.isValid) {
        throw new BadRequestException(
          'Invalid date for creating an individual session after completion.',
        );
      }

      if (sessionDateTime > DateTime.now()) {
        throw new BadRequestException(
          'Cannot mark a session as passed that has not started yet',
        );
      }

      try {
        const isAlreadyCreated = await this.getSingle(
          {
            parentId: existingSession.id,
            startDateTime: sessionDateTime.toJSDate(),
          },
          {
            _relations: ['trainer', 'members'],
          },
        );

        if (isAlreadyCreated) {
          return this.createActualSession(isAlreadyCreated.id, status);
        }
      } catch (error) {
        console.log(error);
      }

      await this.createRuccrenceSingleSession(existingSession, date, status);

      return {
        message: 'Session marked as passed for this date.',
      };
    }

    if (existingSession.startDateTime > new Date()) {
      throw new BadRequestException(
        'Cannot mark a session as passed that has not started yet',
      );
    }

    return { message: 'Session marked as passed successfully' };
  }

  async checkActualSessionsAndCreate(existingSession: Session): Promise<void> {
    const now = new Date();
    const startDateTime = existingSession.startDateTime;

    if (startDateTime > now) {
      return;
    }

    try {
      // Get all expected sessions in the recurrence range
      const allSessions: SessionDto[] = await this.expandRecurringSession(
        existingSession,
        existingSession.startDateTime.toISOString(),
        new Date(now).toISOString(),
      );

      // Get all actual (created) sessions within that range (not including this date)
      const existingActualSessions: Session[] = await this.getAll(
        {},
        SessionListDto,
        {
          beforeQuery: (query: SelectQueryBuilder<Session>) => {
            query.andWhere('entity.parentId = :parentId', {
              parentId: existingSession.id,
            });

            query.andWhere('entity.startDateTime BETWEEN :start AND :end', {
              start: existingSession.startDateTime,
              end: new Date(now),
            });

            return query;
          },
        },
      );

      const actualSessionDates = new Set(
        existingActualSessions.map((s) =>
          s.startDateTime instanceof Date
            ? s.startDateTime.toISOString()
            : new Date(s.startDateTime).toISOString(),
        ),
      );

      // For each missing date (in allSessions, not in actual) except for this date, create/mark as PASSED
      for (const session of allSessions) {
        const sessionDt: string =
          typeof (session as any).startDateTime === 'string'
            ? (session as any).startDateTime
            : (session as any).startDateTime instanceof Date
              ? (session as any).startDateTime.toISOString()
              : '';
        if (!actualSessionDates.has(sessionDt)) {
          // Recursively call to create/mark as PASSED for missing date
          await this.createActualSession(
            `${existingSession.id}@${sessionDt}`,
            ESessionStatus.SCHEDULED,
          );
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  async deleteSession(
    id: string,
    query: { scope?: EUpdateSessionScope },
  ): Promise<IMessageResponse> {
    const idWithDateParts = id.split('@');
    const sessionId = idWithDateParts[0];
    const date = idWithDateParts[1];

    const existingSession = await this.getSingle(sessionId);

    if (!existingSession) {
      throw new NotFoundException('Session not found');
    }

    if (existingSession.enableRecurrence && !query?.scope) {
      throw new BadRequestException(
        'Delete scope is required for recurring sessions',
      );
    }

    const isSessionBillingExist = await this.sessionmMiscService.hasAnyPaidBillingForSession(sessionId)
    if (isSessionBillingExist) {
      throw new BadRequestException('This session cannot be deleted because payment has already been made.',);
    }

    //-------------------------------------------------------------------------
    const scope = query?.scope || EUpdateSessionScope.ALL;

    // If it's a recurring session, handle based on scope
    if (existingSession.enableRecurrence) {
      if (scope !== EUpdateSessionScope.ALL) {
        const dateDT = DateTime.fromISO(date);
        if (!dateDT.isValid) {
          throw new BadRequestException('Invalid date');
        }

        await this.createOrUpdateOverride(
          existingSession,
          date,
          {
            updateScope: scope,
          } as UpdateSessionDto,
          true,
        );

        return { message: 'Session deleted successfully' };
      }
    }

    // For non-recurring or ALL scope, delete the main session
    await this.delete(sessionId, {
      beforeDelete: () => {
        if (existingSession.enableRecurrence) {
          return this.checkActualSessionsAndCreate(existingSession);
        }
      },
    });
    return { message: 'Session deleted successfully' };
  }

  private async createOrUpdateOverride(
    existingSession: Session,
    date: string,
    updateSessionDto: UpdateSessionDto & { notes?: string, price?: number },
    isDeleted?: boolean,
  ): Promise<IMessageResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const overrideSessionDto: Partial<OverrideRecurrenceSession> = {};

      overrideSessionDto.updateScope = updateSessionDto.updateScope;

      if (
        Object.keys(updateSessionDto).filter(
          (key) => updateSessionDto[key] !== undefined,
        ).length === 0
      ) {
        return { message: 'Session updated successfully' };
      }

      if (
        updateSessionDto.status &&
        updateSessionDto.updateScope === EUpdateSessionScope.THIS_AND_FOLLOWING
      ) {
        throw new BadRequestException(
          'Cannot update the status of a recurring sessions',
        );
      }

      if (isDeleted !== undefined) {
        overrideSessionDto.isDeleted = isDeleted;
      }

      if (updateSessionDto.trainer) {
        overrideSessionDto.trainer = {
          id: updateSessionDto.trainer.id,
        } as Staff;
      }
      if (updateSessionDto.members && updateSessionDto.members.length > 0) {
        overrideSessionDto.members = updateSessionDto.members.map((c) => ({
          id: c.id,
        })) as Member[];
      }

      const overrideData: OverrideRecurrenceSession['overrideData'] = {};
      if (updateSessionDto.title !== undefined)
        overrideData.title = updateSessionDto.title;
      if (updateSessionDto.description !== undefined)
        overrideData.description = updateSessionDto.description;
      if (updateSessionDto.duration !== undefined)
        overrideData.duration = updateSessionDto.duration;
      if (updateSessionDto.location !== undefined || updateSessionDto.locationText !== undefined)
        overrideData.location = updateSessionDto.locationText || (updateSessionDto.location as any)?.name || '';
      if (updateSessionDto.price !== undefined)
        overrideData.price = updateSessionDto.price;
      if (updateSessionDto.type !== undefined)
        overrideData.type = updateSessionDto.type;

      if (updateSessionDto.status !== undefined) {
        overrideSessionDto.status = updateSessionDto.status;
      }

      let startDateTime: DateTime;

      if (updateSessionDto.startDateTime) {
        if (
          updateSessionDto.updateScope ===
          EUpdateSessionScope.THIS_AND_FOLLOWING
        ) {
          throw new BadRequestException(
            'Cannot update the start date of a recurring session with THIS_AND_FOLLOWING scope',
          );
        }

        startDateTime = DateTime.fromISO(updateSessionDto.startDateTime);
        overrideSessionDto.startDateTime = startDateTime.toJSDate();
        if (overrideSessionDto.status !== undefined)
          overrideSessionDto.status = ESessionStatus.RESCHEDULED;
      } else {
        startDateTime = DateTime.fromISO(date);
      }

      if (overrideData.duration) {
        const endDateTime = this.calculateEndDateTime(
          startDateTime,
          overrideData.duration,
        );
        overrideData.endDateTime = endDateTime.toISO()!;
      }

      const targetDate = new Date(date);
      const overrideRepo = queryRunner.manager.getRepository(
        OverrideRecurrenceSession,
      );

      // Check for ALL existing overrides for this session and date (both THIS and THIS_AND_FOLLOWING)
      const existingOverride = await overrideRepo.findOne({
        where: {
          session: { id: existingSession.id },
          date: targetDate,
          updateScope: updateSessionDto.updateScope,
          isDeleted: false,
        },
        relations: ['session', 'trainer', 'members'],
      });

      //await this.checkActualSessionsAndCreate(existingSession);

      // Handle scope-specific logic
      if (
        updateSessionDto.updateScope === EUpdateSessionScope.THIS_AND_FOLLOWING
      ) {
        // Instead of deleting, update all following overrides
        const followingOverrides = await overrideRepo.find({
          where: {
            session: { id: existingSession.id },
            date: MoreThanOrEqual(targetDate),
            isDeleted: false,
          },
          relations: ['session'],
        });

        // Update all following overrides with the new values
        for (const override of followingOverrides) {
          const { updatedOverrideData, updatedOverride } =
            this.updateOverrideFields(override, updateSessionDto);

          // Update the override with the new data
          override.overrideData = updatedOverrideData;
          Object.assign(override, updatedOverride);
          await overrideRepo.save(override);
        }
      }

      // Create or update the override with the matching scope
      if (existingOverride) {
        existingOverride.overrideData = {
          ...existingOverride.overrideData,
          ...overrideData,
        };

        if (updateSessionDto.notes) {
          overrideSessionDto.notes =
            (existingOverride.notes || '') + updateSessionDto.notes;
        }

        await overrideRepo.save({
          ...existingOverride,
          ...overrideSessionDto,
        });
      } else {
        overrideSessionDto.overrideData = overrideData;
        overrideSessionDto.session = existingSession;

        overrideSessionDto.date = targetDate;

        if (!updateSessionDto.status) {
          overrideSessionDto.status = existingSession.status;
        }

        if (updateSessionDto.notes) {
          overrideSessionDto.notes = updateSessionDto.notes;
        }

        await overrideRepo.save(overrideSessionDto);
      }

      await queryRunner.commitTransaction();
      return { message: 'Session updated successfully' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.customLogger.error(
        `Error creating/updating override: ${errorMessage}`,
        errorStack,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private updateOverrideFields(
    override: OverrideRecurrenceSession,
    updateSessionDto: UpdateSessionDto,
  ): {
    updatedOverrideData: OverrideRecurrenceSession['overrideData'];
    updatedOverride: Partial<OverrideRecurrenceSession>;
  } {
    const updatedOverrideData: OverrideRecurrenceSession['overrideData'] = {
      ...(override.overrideData || {}),
    };

    const updatedOverride: Partial<OverrideRecurrenceSession> = {};

    // Fields that can be overridden in overrideData
    const overrideableFields = [
      'title',
      'description',
      'duration',
      'location',
      'price',
      'type',
    ];

    // For each overrideable field, check if it's in the update DTO
    for (const field of overrideableFields) {
      if (field in (override.overrideData || {})) {
        // Field was overridden
        if (
          !(field in updateSessionDto) ||
          updateSessionDto[field] === undefined
        ) {
          // Field is not in update DTO, set to undefined
          updatedOverrideData[field] = undefined;
        } else {
          // Field is in update DTO, update it
          updatedOverrideData[field] = updateSessionDto[field];
        }
      } else if (
        field in updateSessionDto &&
        updateSessionDto[field] !== undefined
      ) {
        // Field was not overridden but is in update DTO, add it
        updatedOverrideData[field] = updateSessionDto[field];
      }
    }

    // Handle startDateTime separately
    if (updateSessionDto.startDateTime) {
      updatedOverride.startDateTime = undefined;
    }

    // Handle trainer separately
    if (updateSessionDto.trainer) {
      updatedOverride.trainer = {
        id: updateSessionDto.trainer.id,
      } as Staff;
    } else if (override.trainer && !updateSessionDto.trainer) {
      // trainer was overridden but not in update DTO, set to undefined
      updatedOverride.trainer = undefined;
    }

    // Handle members separately
    if (updateSessionDto.members && updateSessionDto.members.length > 0) {
      updatedOverride.members = updateSessionDto.members.map((c) => ({
        id: c.id,
      })) as Member[];
    } else if (
      override.members &&
      override.members.length > 0 &&
      (!updateSessionDto.members || updateSessionDto.members.length === 0)
    ) {
      // members were overridden but not in update DTO, set to undefined
      updatedOverride.members = undefined;
    }

    return {
      updatedOverrideData,
      updatedOverride,
    };
  }

  async createRuccrenceSingleSession(
    existingSession: Session,
    targetDate: string,
    status?: ESessionStatus,
    startDateTime?: string,
  ): Promise<Session> {
    const overrideRepo = this.entityRouterService.getRepository<OverrideRecurrenceSession>(OverrideRecurrenceSession);
    const deletedOverride = await overrideRepo.findOne({
      where: {
        session: { id: existingSession.id },
        date: new Date(targetDate),
        isDeleted: true,
      },
    });
    if (deletedOverride) {
      this.customLogger.error(
        `Session ${existingSession.id} already has a deleted override for date ${targetDate}`,
      );
      throw new BadRequestException(
        `Session ${existingSession.id} already has a deleted override for date ${targetDate}`,
      );
    }

    const thisOccurenceOverride =
      await overrideRepo.findOne({
        where: {
          session: { id: existingSession.id },
          date: new Date(targetDate),
          updateScope: EUpdateSessionScope.THIS,
          isDeleted: false,
        },
        relations: ['session', 'trainer', 'members'],
      });

    const thisAndFollowingOccurrencesOverride =
      await overrideRepo.findOne({
        where: {
          session: { id: existingSession.id },
          date: LessThanOrEqual(new Date(targetDate)),
          updateScope: EUpdateSessionScope.THIS_AND_FOLLOWING,
          isDeleted: false,
        },
        relations: ['session', 'trainer', 'members'],
      });

    const finalSessionOverride =
      thisOccurenceOverride || thisAndFollowingOccurrencesOverride;

    if (finalSessionOverride && finalSessionOverride.notes) {
      existingSession.notes =
        (existingSession.notes || '') + (finalSessionOverride.notes || '');
    }

    const finalSessionData = {
      ...existingSession,
      ...(finalSessionOverride?.overrideData || {}),
      ...(finalSessionOverride?.trainer
        ? { trainer: { id: finalSessionOverride.trainer.id } }
        : {
          trainer: { id: existingSession.trainer?.id },
        }),
      ...(finalSessionOverride?.members
        ? {
          members: finalSessionOverride.members.map((c) => ({
            id: c.id,
          })),
        }
        : {
          members: existingSession.members?.map((c) => ({ id: c.id })),
        }),
      ...(status ? { status } : {}),
    };

    const session = await this.create(
      {
        ...finalSessionData,
        id: undefined,
        startDateTime: startDateTime || targetDate,
        enableRecurrence: false,
        recurrenceConfig: {},
        parent: existingSession.id,
      },
      {
        afterCreate: async () => {
          await this.createOrUpdateOverride(
            existingSession,
            targetDate,
            {
              status: ESessionStatus.COMPLETED,
              updateScope: EUpdateSessionScope.THIS,
            } as UpdateSessionDto,
            true,
          );
        },
      },
    );

    return session;
  }

  private calculateEndDateTime(
    startDateTime: Date | DateTime,
    duration?: number | null,
    defaultDuration: number = 60,
  ): DateTime {
    const actualDuration = duration ?? defaultDuration;

    const startDT =
      startDateTime instanceof DateTime
        ? startDateTime
        : DateTime.fromJSDate(startDateTime);

    return startDT.plus({ minutes: actualDuration });
  }

  private async getTrainer(
    currentUser: User,
    trainerIdFromDto?: string,
    existingSession?: Session,
  ): Promise<Staff> {
    let trainer: Staff | undefined | null;


    // For create scenario
    if (!existingSession) {
      if (currentUser.level === (EUserLevels.STAFF as number)) {
        // Trainer creating their own session
        trainer = await this.staffService.getSingle(
          {
            userId: currentUser.id,
            isTrainer: true,
          },
          { _relations: ['user'] },
        );

        if (!trainer) {
          throw new NotFoundException(
            'Trainer not found or invalid user level',
          );
        }
      } else {
        // Admin/superadmin creating session -> must provide trainer
        if (!trainerIdFromDto) {
          throw new BadRequestException('Trainer user is required');
        }

        trainer = await this.staffService.getSingle(
          {
            id: trainerIdFromDto,
            isTrainer: true,
          },
          { _relations: ['user'] },
        );

        if (!trainer) {
          throw new NotFoundException(
            'Trainer not found or invalid trainer level',
          );
        }
      }
    } else {
      // For update scenario
      if (
        currentUser.level === (EUserLevels.STAFF as number) &&
        existingSession.trainer?.id !== trainerIdFromDto
      ) {
        // Trainer can only update their own sessions
        trainer = await this.staffService.getSingle(
          {
            userId: currentUser.id,
            isTrainer: true,
          },
          { _relations: ['user'] },
        );

        if (!trainer || trainer.id !== existingSession.trainer?.id) {
          throw new NotFoundException('Session not found or invalid trainer');
        }
      } else if (trainerIdFromDto) {
        // Admin/superadmin updating trainer
        trainer = await this.staffService.getSingle(
          {
            id: trainerIdFromDto,
            isTrainer: true,
          },
          { _relations: ['user'] },
        );

        if (!trainer) {
          throw new NotFoundException(
            'Trainer not found or invalid trainer level',
          );
        }
      } else {
        // Use existing trainer
        trainer = await this.staffService.getSingle(
          {
            id: existingSession.trainer?.id,
            isTrainer: true,
          },
          { _relations: ['user'] },
        );

        if (!trainer) {
          throw new NotFoundException('Trainer not found');
        }
      }
    }

    if (!trainer.user) {
      throw new NotFoundException('Trainer not found');
    }

    return trainer;
  }

  private async getMembers(
    memberIdsFromDto: string[],
    existingMembers?: Member[],
  ): Promise<Member[]> {
    // For create scenario or update with new members
    if (memberIdsFromDto && memberIdsFromDto.length > 0) {
      const members = await this.membersService.getAll(
        {
          __relations: ['user'],
        },
        MemberListDto,
        {
          beforeQuery: (query: SelectQueryBuilder<Member>) => {
            query.andWhere('entity.id IN (:...ids)', { ids: memberIdsFromDto });

            return query;
          },
        },
      );

      if (members.length !== memberIdsFromDto.length) {
        const existingIdsSet = new Set(members.map((c) => c.id));
        const missing = memberIdsFromDto.filter(
          (id) => !existingIdsSet.has(id),
        );
        throw new NotFoundException(
          `Members not found or invalid: ${missing.join(', ')}`,
        );
      }

      return members;
    } else if (existingMembers) {
      // For update scenario - use existing members if no new ones provided
      return existingMembers;
    } else {
      // For create scenario - members are required
      throw new BadRequestException('At least one member must be selected');
    }
  }

  private async getTrainerAvailability(
    trainerId: string,
  ): Promise<UserAvailabilityDto | null> {
    const trainer = await this.staffService.getSingle(
      { id: trainerId, isTrainer: true },
      { _relations: ['user'] },
    );

    if (!trainer || !trainer.user) {
      throw new NotFoundException('Trainer not found');
    }

    const availabilities = await this.userAvailabilityService.getSingle({
      userId: trainer.user.id,
    });

    return availabilities ? (availabilities as UserAvailabilityDto) : null;
  }

  private async getMemberAvailability(
    memberId: string,
  ): Promise<UserAvailabilityDto | null> {
    const member = await this.membersService.getSingle(
      { id: memberId },
      { _relations: ['user'] },
    );

    if (!member || !member.user) {
      return null;
    }

    const availabilities = await this.userAvailabilityService.getSingle({
      userId: member.user.id,
    });

    return availabilities ? (availabilities as UserAvailabilityDto) : null;
  }

  private async getMemberAvailabilities(
    memberIds: string[],
  ): Promise<(UserAvailabilityDto | null)[]> {
    if (!memberIds || memberIds.length === 0) {
      return [];
    }

    // Use getMemberAvailability for each member ID
    return Promise.all(
      memberIds.map((memberId) => this.getMemberAvailability(memberId)),
    );
  }

  private async getTrainerConflictingSessions(
    currentUser: User,
    trainerId: string,
    date: DateTime,
    excludeSessionId?: string,
  ): Promise<SessionDto[]> {
    const startOfDay = date.startOf('day');
    const endOfDay = date.endOf('day');

    const trainerSessions = await this.getCalendarEvents(
      {
        startDate: startOfDay.toISO()!,
        endDate: endOfDay.toISO()!,
      },
      currentUser,
      trainerId,
      undefined,
      excludeSessionId,
    );

    return trainerSessions;
  }

  private async getMemberConflictingSessions(
    currentUser: User,
    memberId: string,
    date: DateTime,
    excludeSessionId?: string,
  ): Promise<SessionDto[]> {
    const startOfDay = date.startOf('day');
    const endOfDay = date.endOf('day');

    const memberSessions = await this.getCalendarEvents(
      {
        startDate: startOfDay.toISO()!,
        endDate: endOfDay.toISO()!,
      },
      currentUser,
      undefined,
      memberId,
      excludeSessionId,
    );

    return memberSessions;
  }

  private async getTrainerAndAllMembersConflictingSessions(
    currentUser: User,
    trainerId: string,
    memberIds: string[],
    date: DateTime,
    excludeSessionId?: string,
  ): Promise<SessionDto[]> {
    const trainerConflicts = await this.getTrainerConflictingSessions(
      currentUser,
      trainerId,
      date,
      excludeSessionId,
    );

    const membersConflictsArrays = await Promise.all(
      memberIds.map((memberId) =>
        this.getMemberConflictingSessions(
          currentUser,
          memberId,
          date,
          excludeSessionId,
        ),
      ),
    );

    // --- Check if all members have conflicts ---
    if (
      membersConflictsArrays.length > 0 &&
      membersConflictsArrays.every((arr) => arr.length > 0)
    ) {
      const firstMemberConflicts = membersConflictsArrays[0];

      // --- Check: all members have same number of conflicts ---
      const sameLength = membersConflictsArrays.every(
        (arr) => arr.length === firstMemberConflicts.length,
      );

      if (sameLength) {
        // --- Check: every conflict slot matches for all members ---
        const allSame = firstMemberConflicts.every((slot, idx) => {
          const startDateTime = new Date(slot.startDateTime);
          const endDateTime = new Date(slot.endDateTime!);
          return membersConflictsArrays.every((arr) => {
            const arrStartDateTime = new Date(arr[idx].startDateTime);
            const arrEndDateTime = new Date(arr[idx].endDateTime!);
            return (
              startDateTime.getTime() === arrStartDateTime.getTime() &&
              endDateTime.getTime() === arrEndDateTime.getTime()
            );
          });
        });

        if (allSame) {
          // Use ALL shared conflict slots
          return [...trainerConflicts, ...firstMemberConflicts];
        }
      }
    }

    // No shared member conflicts → return only trainer conflicts
    return [...trainerConflicts];
  }

  private checkUnavailablePeriod(
    targetDateDT: DateTime,
    unavailableRanges: UnavailableDateRangeDto[],
  ): boolean {
    const dateStr = targetDateDT.toFormat('yyyy-MM-dd');
    return unavailableRanges.some((range) => {
      return dateStr >= range.startDate && dateStr <= range.endDate;
    });
  }

  private checkIsOffDay(
    targetDateDT: DateTime,
    offDays: string[],
  ): { isOffDay: boolean; dayName: string } {
    const dayName = targetDateDT.toFormat('cccc').toLowerCase();
    return { isOffDay: offDays.includes(dayName), dayName };
  }

  private checkTimeSlotInAvailableSlots(
    availableSlots: AvailableTimeSlotDto[],
    sessionStartDT: DateTime,
    duration: number,
    timezone: string,
  ): boolean {
    const sessionEndDT = this.calculateEndDateTime(sessionStartDT, duration);

    return availableSlots.some((slot) => {
      const slotStart = DateTime.fromISO(slot.startTime, {
        zone: timezone,
      });
      const slotEnd = DateTime.fromISO(slot.endTime, {
        zone: timezone,
      });

      // Check if session time fits within this available slot
      return (
        sessionStartDT >= slotStart &&
        sessionEndDT <= slotEnd &&
        sessionStartDT < slotEnd &&
        sessionEndDT > slotStart
      );
    });
  }

  private async validateSessionTimeAvailability(
    currentUser: User,
    trainerId: string,
    memberIds: string[],
    startDateTime: string,
    duration: number,
    timezone: string,
    excludeSessionId?: string,
  ): Promise<{ isValid: boolean; reason?: string }> {
    // First check if the date is available using getAvailableDates
    const { offDays, unavailableRanges } = await this.getAvailableDates({
      trainerId,
      memberIds,
    });

    const sessionStartDT = DateTime.fromISO(startDateTime, {
      zone: timezone,
    });

    const startOfDay = sessionStartDT.startOf('day');

    const { isOffDay, dayName } = this.checkIsOffDay(startOfDay, offDays);
    // Check if this day is an off day
    if (isOffDay) {
      return {
        isValid: false,
        reason: `Trainer or members are not available on ${dayName}. Please select a different date.`,
      };
    }

    // Check if date falls within unavailable date ranges
    if (this.checkUnavailablePeriod(startOfDay, unavailableRanges)) {
      return {
        isValid: false,
        reason:
          'Trainer or members are unavailable on this date. Please select a different date.',
      };
    }

    // Date is available, now check if the specific time slot is available
    const availableSlotsResponse = await this.getAvailableSlots(
      {
        trainerId,
        memberIds,
        date: startOfDay.toISO()!,
        duration,
      },
      currentUser,
      timezone,
      excludeSessionId, // Pass excludeSessionId as separate parameter
    );

    // Check if the exact time slot exists in available slots
    const isAvailable = this.checkTimeSlotInAvailableSlots(
      availableSlotsResponse.slots,
      sessionStartDT,
      duration,
      timezone,
    );

    if (!isAvailable) {
      return {
        isValid: false,
        reason:
          'The selected time is not available. Please select a different time.',
      };
    }

    return { isValid: true };
  }

  private async expandRecurringSession(
    session: Session,
    rangeStart: string,
    rangeEnd: string,
    statuses?: ESessionStatus[],
  ): Promise<SessionDto[]> {
    // If not recurring, return the session as-is
    if (!session.recurrenceConfig || !session.enableRecurrence) {
      if (statuses && !statuses.includes(session.status)) return [];

      return [
        {
          id: session.id,
          title: session.title,
          description: session.description,
          startDateTime: session.startDateTime.toISOString(),
          duration: session.duration,
          endDateTime: session.endDateTime,
          status: session.status,
        } as SessionDto,
      ];
    }

    const { frequency, weekDays, monthDays } = session.recurrenceConfig;
    const sessionStart = new Date(session.startDateTime);
    const recurrenceEnd = new Date(session.recurrenceEndDate!);
    const rangeStartDate = new Date(rangeStart);
    const rangeEndDate = new Date(rangeEnd);

    // Determine the actual end date (whichever comes first)
    // Include the end date by adding one day to make it inclusive
    const actualEndDate =
      recurrenceEnd <= rangeEndDate ? recurrenceEnd : rangeEndDate;

    // Map EScheduleFrequency to RRule Frequency
    const freqMap: Partial<Record<EScheduleFrequency, Frequency>> = {
      [EScheduleFrequency.DAILY]: Frequency.DAILY,
      [EScheduleFrequency.WEEKLY]: Frequency.WEEKLY,
      [EScheduleFrequency.MONTHLY]: Frequency.MONTHLY,
      [EScheduleFrequency.YEARLY]: Frequency.YEARLY,
    };

    const inclusiveEnd = new Date(actualEndDate);
    inclusiveEnd.setDate(inclusiveEnd.getDate() + 1);

    const rruleOptions: Partial<Options> = {
      dtstart: sessionStart,
      until: inclusiveEnd,
      freq: freqMap[frequency] || Frequency.DAILY,
    };

    // Handle frequency-specific options
    if (
      frequency === EScheduleFrequency.WEEKLY &&
      weekDays &&
      weekDays.length > 0
    ) {
      const weekdayMap: Record<EDayOfWeek, typeof RRule.SU> = {
        [EDayOfWeek.SUNDAY]: RRule.SU,
        [EDayOfWeek.MONDAY]: RRule.MO,
        [EDayOfWeek.TUESDAY]: RRule.TU,
        [EDayOfWeek.WEDNESDAY]: RRule.WE,
        [EDayOfWeek.THURSDAY]: RRule.TH,
        [EDayOfWeek.FRIDAY]: RRule.FR,
        [EDayOfWeek.SATURDAY]: RRule.SA,
      };
      rruleOptions.byweekday = weekDays.map((day) => weekdayMap[day]);
    }

    if (
      frequency === EScheduleFrequency.MONTHLY &&
      monthDays &&
      monthDays.length > 0
    ) {
      rruleOptions.bymonthday = monthDays;
    }

    // Create RRule instance
    const rule = new RRule(rruleOptions);

    // Get all occurrences within the range
    const occurrences = rule.between(rangeStartDate, inclusiveEnd, true);

    const trainerId = session.trainer.id;
    const memberIds = [];
    const { offDays, unavailableRanges } = await this.getAvailableDates({
      trainerId,
      memberIds,
    });

    let thisAndFollowingOccurrencesOverride:
      | OverrideRecurrenceSession
      | undefined = undefined;

    // Create session instances for each available occurrence
    const expandedSessions: (Session | undefined)[] = occurrences.map(
      (startDateTime) => {
        const startDateTimeDT = DateTime.fromJSDate(startDateTime);

        const sessionObject = {
          id: `${session.id}@${startDateTime.toISOString()}`,
          title: session.title,
          duration: session.duration,
          status: session.status,
          startDateTime,
          enableRecurrence: false,
        } as Session;

        let thisOccurenceOverride: OverrideRecurrenceSession | undefined =
          undefined;

        if (session.overrides && session.overrides.length > 0) {
          const childSession = session.overrides.filter((override) => {
            if (!override.date) {
              return false;
            }
            const childStartDateTime = DateTime.fromJSDate(override.date);
            return startDateTimeDT.hasSame(childStartDateTime, 'day');
          });

          if (childSession.length > 0) {
            const thisAndFollowingOccurrencesOverrideChild = childSession.find(
              (override) => {
                return (
                  override.updateScope ===
                  EUpdateSessionScope.THIS_AND_FOLLOWING
                );
              },
            );

            if (thisAndFollowingOccurrencesOverrideChild)
              thisAndFollowingOccurrencesOverride =
                thisAndFollowingOccurrencesOverrideChild;

            thisOccurenceOverride = childSession.find((override) => {
              return override.updateScope === EUpdateSessionScope.THIS;
            });
          }
        }

        const activeOverride =
          thisOccurenceOverride || thisAndFollowingOccurrencesOverride;

        if (activeOverride) {
          const overrideData = activeOverride.overrideData;

          if (overrideData) {
            sessionObject.title = overrideData.title ?? session.title;
            sessionObject.duration = overrideData.duration ?? session.duration;
          }

          thisOccurenceOverride = undefined;
        }

        const isActiveOverrideInvalid =
          activeOverride &&
          (activeOverride.isDeleted ||
            (statuses?.length && !statuses.includes(activeOverride.status)));

        const isSessionStatusInvalid =
          !activeOverride &&
          statuses?.length &&
          !statuses.includes(session.status);

        if (isActiveOverrideInvalid || isSessionStatusInvalid) return undefined;

        const occurrenceStartDateTimeDT = DateTime.fromJSDate(
          sessionObject.startDateTime,
        );

        // // Check if this date is an off day
        const { isOffDay } = this.checkIsOffDay(
          occurrenceStartDateTimeDT,
          offDays,
        );
        if (isOffDay) {
          return undefined;
        }

        // // Check if this date falls within unavailable ranges
        if (
          this.checkUnavailablePeriod(
            occurrenceStartDateTimeDT,
            unavailableRanges,
          )
        ) {
          return undefined;
        }

        const endDateTime = session.duration
          ? this.calculateEndDateTime(
            DateTime.fromJSDate(sessionObject.startDateTime),
            session.duration,
          ).toJSDate()
          : undefined;

        sessionObject.endDateTime = endDateTime;

        return sessionObject;
      },
    );

    return expandedSessions
      .filter((session) => session !== undefined)
      .map((session) =>
        plainToInstance(SessionDto, session, {
          excludeExtraneousValues: false,
        }),
      );
  }

  /**
   * Get recent sessions with calendar events for a member
   * Returns sessions close to current date with expanded recurring sessions
   */
  async getRecentSessionsWithCalendarEvents(
    memberId: string,
    limit: number = 5,
    currentUser?: User,
    timezone: string = 'UTC',
  ): Promise<SessionDto[]> {
    // Get member to verify it exists
    const member = await this.membersService.getSingle(
      { id: memberId },
      { _relations: ['user'] },
    );

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Calculate date range: from 7 days ago to 7 days ahead
    const now = DateTime.now().setZone(timezone);
    const startDate = now.minus({ days: 7 }).startOf('day').toISO();
    const endDate = now.plus({ days: 7 }).endOf('day').toISO();

    // Use getCalendarEvents to get sessions with calendar expansion
    const calendarEvents = await this.getCalendarEvents(
      {
        startDate,
        endDate,
        statuses: [],
      } as CalendarEventsRequestDto,
      currentUser || (member.user as User),
      undefined,
      memberId,
    );

    // Sort by startDateTime (closest to now first)
    const sortedEvents = calendarEvents.sort((a, b) => {
      const dateA = new Date(a.startDateTime || 0).getTime();
      const dateB = new Date(b.startDateTime || 0).getTime();
      return dateA - dateB;
    });

    // Return limited results
    return sortedEvents.slice(0, limit);
  }

  /**
   * Get my calendar events - smart method that determines user type and fetches appropriate sessions
   * Optimized: runs trainer/member lookup in parallel, returns based on user level
   */
  async getMyCalendarEvents(
    request: CalendarEventsRequestDto,
    currentUser: User,
  ): Promise<SessionDto[]> {
    const isTrainer = currentUser.level === EUserLevels.STAFF;
    const isMember = currentUser.level === EUserLevels.MEMBER;

    // Parallel lookup for better performance
    const [trainerId, memberId] = await Promise.all([
      isTrainer ? this.staffService.getSingle({ userId: currentUser.id, isTrainer: true }).then(t => t?.id) : undefined,
      isMember ? this.membersService.getSingle({ userId: currentUser.id }).then(m => m?.id) : undefined,
    ]);

    if (trainerId || memberId) {
      return this.getCalendarEvents(request, currentUser, trainerId, memberId);
    }

    return [];
  }
}
