import { useEffect, useRef } from "react";
import { useShallow } from "zustand/shallow";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import type { IListHandlerState, TListHandlerComponentProps } from "@/@types/handler-types";
import type { TicketReplyDto, TicketReplyListDto } from "@shared/dtos/ticket-dtos/ticket-reply.dto";
import type { ITicketRepliesListExtraProps } from "@/components/admin/tickets/replies/ticket-replies-list";
import type { TListHandlerStore } from "@/stores";
import { createTicketReply } from "@/services/ticket.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

type ITicketReplySendProps = TListHandlerComponentProps<
  TListHandlerStore<TicketReplyDto, TicketReplyListDto, ITicketRepliesListExtraProps>
>;

export default function TicketReplySend({ store }: ITicketReplySendProps) {
  const { t } = useI18n();
  const lastProcessedRef = useRef<string | null>(null);

  const { action, payload, extra, response, setResponse, setAction } = store(
    useShallow((state: IListHandlerState<TicketReplyDto, TicketReplyListDto, ITicketRepliesListExtraProps>) => ({
      action: state.action,
      payload: state.payload,
      extra: state.extra,
      response: state.response,
      setResponse: state.setResponse,
      setAction: state.setAction,
    }))
  );

  const { mutate, isPending } = useMutation({
    mutationFn: (data: { ticketId: string; message: string }) => {
      return createTicketReply({
        ticketId: data.ticketId,
        message: data.message.trim(),
      });
    },
    onSuccess: (newReply) => {
      // Append new reply to existing replies using setResponse
      // Use functional update to avoid stale closure issues
      setResponse((currentReplies) => [newReply, ...(currentReplies || [])]);
      setAction?.("", null);
      lastProcessedRef.current = null;
    },
    onError: () => {
      toast.error(buildSentence(t, "failed", "to", "send", "reply"));
      setAction?.("", null);
      lastProcessedRef.current = null;
    },
  });

  useEffect(() => {
    if (action !== "sendReply" || !payload || isPending) return;

    const ticketId = extra?.selectedTicket?.id;
    const message = (payload as { message: string })?.message;

    if (!ticketId || !message?.trim()) {
      setAction?.("", null);
      return;
    }

    // Create a unique key for this request to prevent duplicates
    const requestKey = `${ticketId}-${message.trim()}`;
    
    // Skip if we've already processed this exact request
    if (lastProcessedRef.current === requestKey) {
      return;
    }

    // Mark this request as being processed
    lastProcessedRef.current = requestKey;

    // Clear action immediately to prevent duplicate sends
    setAction?.("", null);

    // Trigger mutation
    mutate({
      ticketId,
      message,
    });
  }, [action, payload, extra, mutate, setAction, isPending]);

  return null;
}
