import { useShallow } from "zustand/shallow";
import { useState, useTransition, useCallback } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IChatsExtraProps } from "./chats";

// Store
import { type TListHandlerStore } from "@/stores";
import { type IListHandlerState } from "@/@types/handler-types/list.type";

// Services
import { addUsersToChat, getChatParticipants } from "@/services/chat.api";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Components
import { ChatAddUsersModal } from "@/components/admin/chat/form/chat-add-users-modal";
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";

export type TChatAddUsersExtraProps = IChatsExtraProps & {
  chatId: string;
};

type IChatAddUsersProps = TListHandlerComponentProps<
  TListHandlerStore<ChatDto, any, TChatAddUsersExtraProps>
>;

export default function ChatAddUsers({
  storeKey,
  store,
}: IChatAddUsersProps) {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [confirmAddUserId, setConfirmAddUserId] = useState<string | null>(null);
  const [confirmAddUserName, setConfirmAddUserName] = useState<string>("User");

  const selector = useShallow(
    (state: IListHandlerState<ChatDto, any, TChatAddUsersExtraProps>) => ({
      action: state.action,
      payload: state.payload,
      response: state.response,
      setAction: state.setAction,
      setResponse: state.setResponse,
    })
  );

  const storeState = store ? store(selector) : null;
  const action = storeState?.action;
  const payload = storeState?.payload as { chatId: string } | null;
  const chatId = payload?.chatId;
  const chats = storeState?.response || [];
  const isOpen = action === "addUsersToChat" && !!chatId;

  // Fetch participants to filter out already added users
  const { data: participantsData } = useQuery({
    queryKey: ['chatParticipants', chatId],
    queryFn: () => getChatParticipants(chatId!),
    enabled: isOpen && !!chatId,
  });

  const handleClose = useCallback(() => {
    if (storeState) {
      storeState.setAction("", null);
    }
    setAddingUserId(null);
    setConfirmAddUserId(null);
    setConfirmAddUserName("User");
  }, [storeState]);

  const handleSubmit = useCallback((userId: string, userName: string) => {
    setConfirmAddUserId(userId);
    setConfirmAddUserName(userName);
  }, []);

  const handleConfirmAdd = useCallback(async () => {
    if (!chatId || !confirmAddUserId) return;

    setAddingUserId(confirmAddUserId);
    setIsSubmitting(true);
    setConfirmAddUserId(null);
    
    startTransition(async () => {
      try {
        await addUsersToChat(chatId, [confirmAddUserId]);

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['chatParticipants', chatId] });

        toast.success(buildSentence(t, "user", "added", "to", "chat", "successfully"));
      } catch (error: any) {
        toast.error(error?.message || buildSentence(t, "failed", "to", "add", "user", "to", "chat"));
      } finally {
        setIsSubmitting(false);
        setAddingUserId(null);
      }
    });
  }, [chatId, confirmAddUserId, storeState, chats, queryClient, storeKey, t]);

  if (!chatId) return null;

  return (
    <>
      <ChatAddUsersModal
        open={isOpen}
        onClose={handleClose}
        chatId={chatId}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting && !!addingUserId}
        existingParticipants={participantsData || []}
      />
      
      <ConfirmDialog
        open={!!confirmAddUserId}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAddUserId(null);
            setConfirmAddUserName("User");
          }
        }}
        title={buildSentence(t, "add", "user", "to", "chat")}
        description={`${buildSentence(t, "are", "you", "sure", "you", "want", "to", "add")} ${confirmAddUserName} ${buildSentence(t, "to", "this", "chat")}?`}
        confirmText={buildSentence(t, "add", "user")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmAdd}
      />
    </>
  );
}

