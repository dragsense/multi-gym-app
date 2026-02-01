// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ISchedule } from "@shared/interfaces/schedule.interface";
import { CreateScheduleDto, UpdateScheduleDto } from "@shared/dtos";

// Constants
const SCHEDULES_API_PATH = "/schedules";

// Create base service instance
const scheduleService = new BaseService<
  ISchedule,
  CreateScheduleDto,
  UpdateScheduleDto
>(SCHEDULES_API_PATH);

// Re-export all CRUD operations using the base service
export const fetchSchedules = (params: IListQueryParams) =>
  scheduleService.get(params);
export const fetchSchedule = (id: string) => scheduleService.getSingle(id);
export const createSchedule = (data: CreateScheduleDto) =>
  scheduleService.post(data);
export const updateSchedule = (id: string) => scheduleService.put(id);
export const deleteSchedule = (id: string) => scheduleService.delete(id);
