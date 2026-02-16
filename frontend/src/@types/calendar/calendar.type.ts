import type { Dispatch } from "react";
import type { SetStateAction } from "react";

export interface CalendarEvent {
  id: string | number;
  title: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  type?: string;
  status?: string;
  color?: string;
  [key: string]: any;
}

export interface CalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  currentDate: Date;
  setCurrentDate: Dispatch<SetStateAction<Date>>;
  view: CalendarViewType;
  setView: Dispatch<SetStateAction<CalendarViewType>>;
  className?: string;
}

export type CalendarViewType = "month" | "week" | "day";
