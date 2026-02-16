// React
import { useId } from "react";
import { useParams } from "react-router-dom";

// Handlers
import { SingleHandler } from "@/handlers";

// Types
import type { ITicket } from "@shared/interfaces/ticket.interface";

// Services
import { fetchTicket } from "@/services/ticket.api";

// Page Components
import { TicketDetailContent, TicketForm, TicketStatusUpdate } from "@/page-components/ticket";

export default function TicketDetailPage() {
  const componentId = useId();
  const { id } = useParams<{ id: string }>();

  const TICKET_DETAIL_STORE_KEY = `ticket-detail-${id}`;

  return (
    <div data-component-id={componentId}>
      <SingleHandler<ITicket>
        queryFn={(_, params) => fetchTicket(id!, params)}
        initialParams={{
          _relations: "createdBy, assignedTo",
        }}
        storeKey={TICKET_DETAIL_STORE_KEY}
        enabled={!!id}
        SingleComponent={TicketDetailContent}
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
    </div>
  );
}
