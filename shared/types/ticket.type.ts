import {
  CreateTicketDto,
  UpdateTicketDto,
  TicketListDto,
  CreateTicketReplyDto,
  UpdateTicketReplyDto,
  TicketReplyListDto,
} from "../dtos";

export type TTicketData = CreateTicketDto;
export type TUpdateTicketData = UpdateTicketDto;
export type TTicketListData = TicketListDto;

export type TTicketReplyData = CreateTicketReplyDto;
export type TUpdateTicketReplyData = UpdateTicketReplyDto;
export type TTicketReplyListData = TicketReplyListDto;

// Legacy type aliases for backward compatibility
export type TCreateTicketData = TTicketData;
export type TCreateTicketReplyData = TTicketReplyData;
