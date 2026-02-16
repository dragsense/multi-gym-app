// External Libraries
import { useShallow } from "zustand/shallow";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useTransition, useState, useEffect } from "react";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatMessageDto, ChatMessageListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IMessageListExtraProps } from "@/components/admin/chat/messages/message-list";

// Store
import { type TListHandlerStore } from "@/stores";
import { type IListHandlerState } from "@/@types/handler-types/list.type";

// Components
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { deleteMessage } from "@/services/chat.api";
import { toast } from "sonner";

type IMessageDeleteProps = TListHandlerComponentProps<
  TListHandlerStore<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>
>;

export default function MessageDelete({
  storeKey,
  store,
}: IMessageDeleteProps) {
  // React 19: Essential IDs and transitions - ALL HOOKS MUST BE CALLED FIRST
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  // Always call hooks unconditionally - create selector first
  const selector = useShallow(
    (state: IListHandlerState<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>) => ({
      action: state.action,
      payload: state.payload,
      response: state.response,
      setAction: state.setAction,
      setResponse: state.setResponse,
    })
  );

  const storeState = store ? store(selector) : null;
  const payload = storeState?.payload as { messageId: string; deleteFor: "everyone" | "self" } | null;
  const messageId = payload?.messageId;
  const deleteFor = payload?.deleteFor || "self";
  const messages = storeState?.response || [];
  const action = storeState?.action;
  const isOpen = action === "deleteMessage";

  const handleClose = useCallback(() => {
    if (!storeState) return;
    startTransition(() => {
      setError(null);
      storeState.setAction("", null);
    });
  }, [storeState, startTransition]);

  const deleteMutation = useApiMutation(
    async (id: string) => {
      const result = await deleteMessage(id, deleteFor);
      return result;
    },
    {
      onSuccess: () => {
        startTransition(() => {
          if (storeState && messages) {
            if (deleteFor === "everyone") {
              // Mark as deleted for everyone
              storeState.setResponse(
                messages.map((m: ChatMessageDto) =>
                  m.id === messageId
                    ? {
                        ...m,
                        isDeleted: true,
                        deletedFor: "everyone",
                        message: "This message is deleted by user",
                      }
                    : m
                )
              );
            } else {
              // Remove from list (deleted for self)
              storeState.setResponse(messages.filter((m: ChatMessageDto) => m.id !== messageId));
            }
          }
          queryClient.invalidateQueries({
            queryKey: [storeKey],
          });
          toast.success(buildSentence(t, "message", "deleted", "successfully"));
          handleClose();
        });
      },
      onError: (error: Error) => {
        startTransition(() => {
          setError(error?.message || "Failed to delete message");
          toast.error(`Failed to delete message: ${error.message}`);
        });
      },
    }
  );

  const handleConfirm = useCallback(() => {
    if (!messageId) return;
    deleteMutation.mutate(messageId);
  }, [messageId, deleteMutation]);

  useEffect(() => {
    if (isOpen && messageId) {
      // Dialog will be shown via ConfirmDialog component
    }
  }, [isOpen, messageId]);

  // Early returns AFTER all hooks
  if (!store) {
    return (
      <div>
        {buildSentence(t, "list", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  if (!isOpen || !messageId) {
    return null;
  }

  const title = buildSentence(t, "delete", "message");
  const description =
    deleteFor === "everyone"
      ? `${buildSentence(t, "are", "you", "sure", "you", "want", "to", "delete", "this", "message", "for", "everyone")}? ${buildSentence(t, "this", "action", "cannot", "be", "undone")}.`
      : `${buildSentence(t, "are", "you", "sure", "you", "want", "to", "delete", "this", "message")}?`;

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={handleClose}
      title={title}
      description={description}
      confirmText={buildSentence(t, "delete")}
      cancelText={t("cancel")}
      onConfirm={handleConfirm}
      variant="destructive"
    />
  );
}

