// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { ISession } from "@shared/interfaces/session.interface";
import type { TSessionData } from "@shared/types/session.type";
import type { TQueryParams } from "@shared/types/api/param.type";
import type { EUpdateSessionScope } from "@shared/enums/session.enum";

// Constants
const SESSIONS_API_PATH = "/sessions";

// Create base service instance
const sessionService = new BaseService<
  ISession,
  TSessionData,
  Partial<TSessionData>
>(SESSIONS_API_PATH);

// Re-export common CRUD operations
export const fetchSessions = (params: IListQueryParams, locationId?: string) =>
  sessionService.get({...params, filters: { ...(params.filters || {}), locationId }});
export const fetchSession = (
  payload: string | { id: string },
  params: TQueryParams
) => sessionService.getSingle(payload, params);

export const createSession = (data: TSessionData) => sessionService.post(data);
export const updateSession = (id: string) => sessionService.patch(id);

export const deleteSession = (payload: {
  id: string;
  scope?: EUpdateSessionScope;
}) => {
  const queryParams: TQueryParams = {};

  if (payload?.scope) {
    queryParams.scope = payload.scope;
  }

  if (!payload.id) throw new Error("Id is required");

  return sessionService.delete(payload.id, queryParams);
};

// Available slots
export const getAvailableSlots = (data: {
  trainerId: string;
  memberIds: string[];
  date: string;
  duration?: number;
}) =>
  sessionService.post<{
    slots: Array<{ startTime: string; endTime: string }>;
    date: string;
  }>(data, undefined, "/available-slots");

// Available dates
export const getAvailableDates = (data: {
  trainerId: string;
  memberIds: string[];
  duration?: number;
}) =>
  sessionService.post<{
    offDays: string[];
    unavailableRanges: Array<{
      startDate: string;
      endDate: string;
      reason?: string;
    }>;
  }>(data, undefined, "/available-dates");

// Calendar events
export const fetchCalendarEvents = (params: TQueryParams) =>
  sessionService.getAll<ISession>(params, "/calendar/events");

// Cancel session
export const cancelSession = (id: string, reason?: string) =>
  sessionService.patch<{ message: string }>(id)(
    reason ? { reason } as any : undefined,
    undefined,
    "/cancel"
  );

// Reactivate session
export const reactivateSession = (id: string) =>
  sessionService.patch<{ message: string }>(id)(
    undefined,
    undefined,
    "/reactivate"
  );

// Complete session
export const completeSession = (id: string) =>
  sessionService.patch<{ message: string }>(id)(
    undefined,
    undefined,
    "/complete"
  );

// Update session notes
export const updateSessionNotes = (
  id: string,
  data: {
    notes?: string;
    additionalNotes?: string;
    updateScope?: EUpdateSessionScope;
  }
) => sessionService.patch<{ message: string }>(id)(data, undefined, "/notes");


export const fetchMemberSessions = (
  memberId: string,
  params?: TQueryParams
) => {
  return sessionService.getAll<ISession>(
    params,
    `/member/${memberId}/events`
  );
};

export const fetchTrainerSessions = (
  trainerId: string,
  params?: TQueryParams
) => {
  return sessionService.getAll<ISession>(
    params,
    `/trainer/${trainerId}/events`
  );
};

// Get my upcoming sessions (for current logged-in member)
export const fetchMySessions = (
  params?: TQueryParams
) => {
  return sessionService.getAll<ISession>(
    params,
    `/me/events`
  );
};
