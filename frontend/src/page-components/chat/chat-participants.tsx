import { useShallow } from "zustand/shallow";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

// Types
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IChatsExtraProps } from "./chats";

// Store
import { type TListHandlerStore } from "@/stores";
import { type IListHandlerState } from "@/@types/handler-types/list.type";

// Services
import { getChatParticipants, removeUserFromChat, makeUserAdmin, fetchChat } from "@/services/chat.api";

// Components
import { ChatParticipantsModal } from "@/components/admin/chat/form/chat-participants-modal";
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useApiMutation } from "@/hooks/use-api-mutation";

export type TChatParticipantsExtraProps = IChatsExtraProps & {
  chatId: string;
};

type IChatParticipantsProps = TListHandlerComponentProps<
  TListHandlerStore<ChatDto, any, TChatParticipantsExtraProps>
>;

export default function ChatParticipants({
  storeKey,
  store,
}: IChatParticipantsProps) {
  const { user } = useAuthUser();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [makingAdminUserId, setMakingAdminUserId] = useState<string | null>(null);
  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState<string | null>(null);
  const [confirmMakeAdminUserId, setConfirmMakeAdminUserId] = useState<string | null>(null);

  const selector = useShallow(
    (state: IListHandlerState<ChatDto, any, TChatParticipantsExtraProps>) => ({
      action: state.action,
      payload: state.payload,
      setAction: state.setAction,
    })
  );

  const storeState = store ? store(selector) : null;
  const action = storeState?.action;
  const payload = storeState?.payload as { chatId: string } | null;
  const chatId = payload?.chatId;
  const isOpen = action === "showParticipants" && !!chatId;

  // Fetch participants from backend
  const { data: participantsData, isLoading, refetch } = useQuery({
    queryKey: ['chatParticipants', chatId],
    queryFn: () => getChatParticipants(chatId!),
    enabled: isOpen && !!chatId,
  });

  // Fetch chat data to get isGroup
  const { data: chatData } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () => fetchChat(chatId!),
    enabled: isOpen && !!chatId,
  });

  const removeUserMutation = useApiMutation(
    async ({ chatId, userId }: { chatId: string; userId: string }) => {
      return await removeUserFromChat(chatId, userId);
    },
    {
      onSuccess: () => {
        toast.success(buildSentence(t, "user", "removed", "from", "chat", "successfully"));
        queryClient.invalidateQueries({ queryKey: ['chatParticipants', chatId] });
        setRemovingUserId(null);
      },
      onError: (error: Error) => {
        toast.error(error?.message || buildSentence(t, "failed", "to", "remove", "user", "from", "chat"));
        setRemovingUserId(null);
      },
    }
  );

  const makeAdminMutation = useApiMutation(
    async ({ chatId, userId }: { chatId: string; userId: string }) => {
      return await makeUserAdmin(chatId, userId);
    },
    {
      onSuccess: () => {
        toast.success(buildSentence(t, "user", "made", "admin", "successfully"));
        queryClient.invalidateQueries({ queryKey: ['chatParticipants', chatId] });
        setMakingAdminUserId(null);
      },
      onError: (error: Error) => {
        toast.error(error?.message || buildSentence(t, "failed", "to", "make", "user", "admin"));
        setMakingAdminUserId(null);
      },
    }
  );

  const handleClose = useCallback(() => {
    if (storeState) {
      storeState.setAction("", null);
    }
    setRemovingUserId(null);
    setMakingAdminUserId(null);
    setConfirmRemoveUserId(null);
    setConfirmMakeAdminUserId(null);
  }, [storeState]);

  const handleRemoveUser = useCallback((chatId: string, userId: string) => {
    setConfirmRemoveUserId(userId);
  }, []);

  const handleMakeAdmin = useCallback((chatId: string, userId: string) => {
    setConfirmMakeAdminUserId(userId);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (!chatId || !confirmRemoveUserId) return;
    setRemovingUserId(confirmRemoveUserId);
    setConfirmRemoveUserId(null);
    removeUserMutation.mutate({ chatId, userId: confirmRemoveUserId });
  }, [chatId, confirmRemoveUserId, removeUserMutation]);

  const handleConfirmMakeAdmin = useCallback(() => {
    if (!chatId || !confirmMakeAdminUserId) return;
    setMakingAdminUserId(confirmMakeAdminUserId);
    setConfirmMakeAdminUserId(null);
    makeAdminMutation.mutate({ chatId, userId: confirmMakeAdminUserId });
  }, [chatId, confirmMakeAdminUserId, makeAdminMutation]);

  if (!chatId || !isOpen) return null;

  const participantToRemove = participantsData?.find((p: any) => p.user?.id === confirmRemoveUserId);
  const participantToMakeAdmin = participantsData?.find((p: any) => p.user?.id === confirmMakeAdminUserId);
  const removeUserName = participantToRemove?.user 
    ? `${participantToRemove.user.firstName || ""} ${participantToRemove.user.lastName || ""}`.trim() || participantToRemove.user.email || "User"
    : "User";
  const makeAdminUserName = participantToMakeAdmin?.user
    ? `${participantToMakeAdmin.user.firstName || ""} ${participantToMakeAdmin.user.lastName || ""}`.trim() || participantToMakeAdmin.user.email || "User"
    : "User";

  return (
    <>
      <ChatParticipantsModal
        open={isOpen}
        onClose={handleClose}
        chatId={chatId}
        participants={participantsData}
        isLoading={isLoading}
        isGroup={chatData?.isGroup ?? false}
        onRemoveUser={handleRemoveUser}
        onMakeAdmin={handleMakeAdmin}
        removingUserId={removingUserId}
        makingAdminUserId={makingAdminUserId}
      />
      
      <ConfirmDialog
        open={!!confirmRemoveUserId}
        onOpenChange={(open) => {
          if (!open) setConfirmRemoveUserId(null);
        }}
        title={buildSentence(t, "remove", "user", "from", "chat")}
        description={`${buildSentence(t, "are", "you", "sure", "you", "want", "to", "remove")} ${removeUserName} ${buildSentence(t, "from", "this", "chat")}? ${buildSentence(t, "this", "action", "cannot", "be", "undone")}.`}
        confirmText={buildSentence(t, "remove", "user")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmRemove}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!confirmMakeAdminUserId}
        onOpenChange={(open) => {
          if (!open) setConfirmMakeAdminUserId(null);
        }}
        title={buildSentence(t, "make", "user", "admin")}
        description={`${buildSentence(t, "are", "you", "sure", "you", "want", "to", "make")} ${makeAdminUserName} ${buildSentence(t, "an", "admin", "of", "this", "chat")}?`}
        confirmText={buildSentence(t, "make", "admin")}
        cancelText={t("cancel")}
        onConfirm={handleConfirmMakeAdmin}
      />
    </>
  );
}

