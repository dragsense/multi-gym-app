import { useQueryClient } from "@tanstack/react-query";
import { useId, useTransition } from "react";

// Types
import { TicketListDto, type TicketDto } from "@shared/dtos/ticket-dtos";
import type { ITicket } from "@shared/interfaces/ticket.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Page Components
import { TicketForm, TicketStatusUpdate } from "@/page-components/ticket";

// Components
import { TicketView, TicketList } from "@/components/admin/tickets";

// Services
import { fetchTickets, fetchTicket, deleteTicket } from '@/services/ticket.api';

// Layouts
import { PageInnerLayout } from "@/layouts";

export default function TicketsPage() {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const TICKETS_STORE_KEY = "ticket";

  return (
    <PageInnerLayout Header={<Header />}>
      <div data-component-id={componentId}>
        {/* SingleHandler for create/update/status actions (no view - view is on detail page) */}
        <SingleHandler<ITicket>
          queryFn={fetchTicket}
          initialParams={{
            _relations: 'createdBy, assignedTo',
          }}
          storeKey={TICKETS_STORE_KEY}
          SingleComponent={TicketView}
          actionComponents={[
            {
              action: "createOrUpdate",
              comp: TicketForm,
            },
            {
              action: "updateStatus",
              comp: TicketStatusUpdate,
            },
          ]}
        />

        <ListHandler<TicketDto, any, any, ITicket, any>
          queryFn={fetchTickets}
          deleteFn={deleteTicket}
          dto={TicketListDto}
          initialParams={{
            _relations: 'createdBy, assignedTo',
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          }}
          ListComponent={TicketList}
          storeKey={TICKETS_STORE_KEY}
          onDeleteSuccess={() => {
            startTransition(() => {
              queryClient.invalidateQueries({
                queryKey: [TICKETS_STORE_KEY + "-list"],
              });
            });
          }}
        />
      </div>
    </PageInnerLayout>
  );
}

const Header = () => null;
