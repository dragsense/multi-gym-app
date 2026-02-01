import { WeeklyScheduleDto } from '@shared/dtos/user-availability-dtos/user-availability.dto';

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleDto = {
  monday: {
    enabled: true,
    timeSlots: [{ start: '09:00', end: '17:00' }],
  },
  tuesday: {
    enabled: true,
    timeSlots: [{ start: '09:00', end: '17:00' }],
  },
  wednesday: {
    enabled: true,
    timeSlots: [{ start: '09:00', end: '17:00' }],
  },
  thursday: {
    enabled: true,
    timeSlots: [{ start: '09:00', end: '17:00' }],
  },
  friday: {
    enabled: true,
    timeSlots: [{ start: '09:00', end: '17:00' }],
  },
  saturday: { enabled: false, timeSlots: [] },
  sunday: { enabled: false, timeSlots: [] },
};
