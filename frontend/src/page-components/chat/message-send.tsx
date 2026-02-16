// External Libraries
import { useShallow } from "zustand/shallow";
import { useEffect, useTransition, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatMessageDto, ChatMessageListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IMessageListExtraProps } from "@/components/admin/chat/messages/message-list";

// Store
import { type TListHandlerStore } from "@/stores";
import { type IListHandlerState } from "@/@types/handler-types/list.type";

// Services
import { sendMessage } from "@/services/chat.api";

type IMessageSendProps = TListHandlerComponentProps<
  TListHandlerStore<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>
>;

export default function MessageSend({
  storeKey,
  store,
}: IMessageSendProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const isSendingRef = useRef(false);

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: IListHandlerState<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>) => ({
      action: state.action,
      payload: state.payload,
      extra: state.extra,
      response: state.response,
      setAction: state.setAction,
      setResponse: state.setResponse,
    })
  );

  const storeState = store ? store(selector) : null;
  const action = storeState?.action;
  const payload = storeState?.payload as {
    message: string;
    file?: File;
  } | null;
  const chatId = storeState?.extra?.selectedChat?.id;
  const setAction = storeState?.setAction;

  useEffect(() => {
    if (action !== "sendMessage" || !payload) {
      isSendingRef.current = false;
      return;
    }

    // Prevent duplicate submissions
    if (isSendingRef.current) return;

    if (!chatId) {
      toast.error("No chat selected");
      if (setAction) {
        setAction("", null);
      }
      return;
    }

    const { message, file } = payload;

    if (!message?.trim() && !file) {
      if (setAction) {
        setAction("", null);
      }
      return;
    }

    // Mark as sending to prevent duplicates
    isSendingRef.current = true;

    // Clear action immediately to prevent re-triggering
    if (setAction) {
      setAction("", null);
    }

    startTransition(async () => {
      try {
        await sendMessage({
          chatId: chatId,
          message: message?.trim() || "",
        }, file);


        toast.success("Message sent");
      } catch (error) {
        toast.error("Failed to send message");
      } finally {
        // Reset sending flag
        isSendingRef.current = false;
      }
    });
  }, [action, payload, chatId, setAction, queryClient, storeKey]);

  return null;
}

