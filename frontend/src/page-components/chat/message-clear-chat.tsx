// External Libraries
import { useShallow } from "zustand/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatMessageDto, ChatMessageListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IMessageListExtraProps } from "@/components/admin/chat/messages/message-list";

// Store
import { type TListHandlerStore } from "@/stores";

// Components
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { clearChat } from "@/services/chat.api";
import { toast } from "sonner";

type IMessageClearChatProps = TListHandlerComponentProps<
  TListHandlerStore<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>
>;

export default function MessageClearChat({
  storeKey,
  store,
}: IMessageClearChatProps) {
  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "list", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  const { action, payload, setAction, setResponse, setPagination, pagination } = store(
    useShallow((state) => ({
      action: state.action,
      payload: state.payload,
      setAction: state.setAction,
      setResponse: state.setResponse,
      setPagination: state.setPagination,
      pagination: state.pagination,
    }))
  );

  const chatId = (payload as { chatId: string } | null)?.chatId;
  const isOpen = action === "clearChat";

  const handleClose = useCallback(() => {
    setAction("", null);
  }, [setAction]);

  const clearChatMutation = useApiMutation(
    (id: string) => clearChat(id),
    {
      onSuccess: () => {
  
        setPagination({ ...pagination, page: 1, total: 0 });
        setResponse([]);
        queryClient.invalidateQueries({
          queryKey: [storeKey + "-list"],
        });
        toast.success(buildSentence(t, "chat", "cleared", "successfully"));
        handleClose();
      },
      onError: (error: Error) => {
        toast.error(`Failed to clear chat: ${error.message}`);
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!chatId) return;
    clearChatMutation.mutate(chatId);
  }, [chatId, clearChatMutation]);


  if (!isOpen || !chatId) {
    return null;
  }

  const title = buildSentence(t, "clear", "chat");
  const description = `${buildSentence(t, "are", "you", "sure", "you", "want", "to", "clear", "this", "chat")}? ${buildSentence(t, "this", "will", "remove", "all", "messages", "for", "you", "only")}. ${buildSentence(t, "this", "action", "cannot", "be", "undone")}.`;

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={handleClose}
      title={title}
      description={description}
      confirmText={buildSentence(t, "clear")}
      cancelText={t("cancel")}
      onConfirm={handleConfirm}
      variant="destructive"
    />
  );
}

