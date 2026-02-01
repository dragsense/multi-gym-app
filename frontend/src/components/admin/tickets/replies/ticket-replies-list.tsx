import { useId } from "react";
import { useShallow } from "zustand/shallow";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TListHandlerStore } from "@/stores";
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import type { TicketReplyDto, TicketReplyListDto } from "@shared/dtos/ticket-dtos/ticket-reply.dto";
import type { TicketDto } from "@shared/dtos/ticket-dtos/ticket.dto";
import { TicketReplyInput } from "./ticket-reply-input";
import { Replies } from "./replies";

export interface ITicketRepliesListExtraProps {
  selectedTicket?: TicketDto;
}

interface ITicketRepliesListProps
  extends TListHandlerComponentProps<TListHandlerStore<TicketReplyDto, TicketReplyListDto, ITicketRepliesListExtraProps>> { }

export function TicketRepliesList({ storeKey, store }: ITicketRepliesListProps) {
  const componentId = useId();

  if (!store) {
    return <div>List store "{storeKey}" not found.</div>;
  }

  const { setAction } = store(
    useShallow((state) => ({
      setAction: state.setAction,
    }))
  );

  const handleSend = (message: string) => {
    setAction("sendReply", { message });
  };

  return (
    <div data-component-id={componentId} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-400px)]">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 p-4">
            <Replies store={store} />
          </div>
        </ScrollArea>
      </div>
      <div className="flex-shrink-0">
        <TicketReplyInput onSend={handleSend} />
      </div>
    </div>
  );
}
