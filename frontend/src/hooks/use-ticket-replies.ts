// React
import { useQuery } from "@tanstack/react-query";

// Services
import { fetchTicketRepliesByTicketId } from "@/services/ticket.api";

// Types
import type { ITicketReply } from "@shared/interfaces/ticket.interface";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";

interface IUseTicketRepliesParams {
  ticketId: string;
  params?: IListQueryParams;
  enabled?: boolean;
}

/**
 * Hook to fetch ticket replies for a specific ticket
 */
export function useTicketReplies({ 
  ticketId, 
  params,
  enabled = true 
}: IUseTicketRepliesParams) {
  return useQuery<ITicketReply[]>({
    queryKey: ["ticket-replies", ticketId, params],
    queryFn: () => fetchTicketRepliesByTicketId(ticketId, {
      _relations: "createdBy",
      _select: "createdBy.email, createdBy.firstName, createdBy.lastName",
      sortBy: "createdAt",
      sortOrder: "ASC",
      ...params,
    }),
    enabled: !!ticketId && enabled,
  });
}
