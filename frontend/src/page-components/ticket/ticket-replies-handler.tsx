import { ListHandler } from "@/handlers";
import { TicketDto } from "@shared/dtos/ticket-dtos/ticket.dto";
import { TicketReplyDto, TicketReplyListDto } from "@shared/dtos/ticket-dtos/ticket-reply.dto";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import { fetchTicketRepliesByTicketId } from "@/services/ticket.api";
import { TicketRepliesList, type ITicketRepliesListExtraProps } from "@/components/admin/tickets/replies/ticket-replies-list";
import { EmptyTicket } from "@/components/admin/tickets/replies/empty-ticket";
import TicketReplySend from "./ticket-reply-send";

interface ITicketRepliesHandlerProps {
  selectedTicket: TicketDto | null;
  storeKey: string;
}

export function TicketRepliesHandler({
  selectedTicket,
  storeKey,
}: ITicketRepliesHandlerProps) {

  // Don't render if no ticket is selected
  if (!selectedTicket) {
    return <EmptyTicket />;
  }

  return (
    <ListHandler<TicketReplyDto, TicketReplyListDto, ITicketRepliesListExtraProps>
      queryFn={(params: IListQueryParams) => fetchTicketRepliesByTicketId(selectedTicket.id, params)}
      ListComponent={TicketRepliesList}
      storeKey={storeKey + "-replies-" + selectedTicket.id}
      initialParams={{
        _relations: "createdBy",
        _select: "createdBy.email, createdBy.firstName, createdBy.lastName",
        sortBy: "createdAt",
        sortOrder: "DESC",
        page: 1,
        limit: 20,
      }}
      listProps={{
        selectedTicket: selectedTicket,
      }}
      actionComponents={[
        {
          action: "sendReply",
          comp: TicketReplySend,
        },
      ]}
    />
  );
}
