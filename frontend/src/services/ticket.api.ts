// Utils
import { BaseService } from "./base.service.api";

// Types
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { TCreateTicketData, TUpdateTicketData } from "@shared/types/ticket.type";
import type {  TCreateTicketReplyData, TUpdateTicketReplyData } from "@shared/types/ticket.type";
import type { ITicket, ITicketReply } from "@shared/interfaces/ticket.interface";


// Constants
const TICKETS_API_PATH = "/tickets";
const TICKET_REPLIES_API_PATH = "/ticket-replies";

// Create base service instances
const ticketService = new BaseService<
  ITicket,
  TCreateTicketData,
  TUpdateTicketData
>(TICKETS_API_PATH);

const ticketReplyService = new BaseService<
  ITicketReply,
  TCreateTicketReplyData,
  TUpdateTicketReplyData
>(TICKET_REPLIES_API_PATH);

// Ticket operations
export const fetchTickets = (params: IListQueryParams) =>
  ticketService.get<ITicket>(params);

export const fetchTicket = (id: string, params?: Record<string, any>) =>
  ticketService.getSingle<ITicket>(id, params);

export const createTicket = (data: TCreateTicketData) =>
  ticketService.post<ITicket>(data);

export const updateTicket = (id: string) => (data: TUpdateTicketData) =>
  ticketService.patch<ITicket>(id)(data);

export const deleteTicket = (id: string) =>
  ticketService.delete(id);

// Ticket Reply operations
export const fetchTicketReplies = (params: IListQueryParams) =>
  ticketReplyService.get<ITicketReply>(params);

export const fetchTicketRepliesByTicketId = (ticketId: string, params?: IListQueryParams) =>
  ticketReplyService.get<ITicketReply>(params, `/ticket/${ticketId}`);

export const fetchTicketReply = (id: string, params?: Record<string, any>) =>
  ticketReplyService.getSingle<ITicketReply>(id, params);

export const createTicketReply = (data: TCreateTicketReplyData) =>
  ticketReplyService.post<ITicketReply>(data);

export const updateTicketReply = (id: string) => (data: TUpdateTicketReplyData) =>
  ticketReplyService.patch<ITicketReply>(id)(data);

export const deleteTicketReply = (id: string) =>
  ticketReplyService.delete(id);
