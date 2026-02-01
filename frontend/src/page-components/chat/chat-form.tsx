// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatDto, CreateChatDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IChatsExtraProps } from "./chats";

// Store
import { type TListHandlerStore } from "@/stores";
import { type IListHandlerState } from "@/@types/handler-types/list.type";

// Components
import { ChatFormModal } from "@/components/admin/chat/form/chat-form-modal";
import type { IChatFormModalExtraProps } from "@/components/admin/chat/form/chat-form-modal";

// Services
import { createChat, updateChat } from "@/services/chat.api";
import { strictDeepMerge } from "@/utils";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { CreateChatDto as CreateChatDtoClass, UpdateChatDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { UserDto } from "@shared/dtos";

type IChatFormProps = TListHandlerComponentProps<
  TListHandlerStore<ChatDto, any, IChatsExtraProps>
>;

export default function ChatForm({ storeKey, store }: IChatFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();

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

  const { action, payload, setAction, response } = store(
    useShallow((state) => ({
      action: state.action,
      payload: state.payload,
      setAction: state.setAction,
      response: state.response,
    }))
  );

  const { chatId, isGroup } = payload ?? { chatId: undefined, isGroup: false };
  const chat = chatId
    ? (response || []).find((c: ChatDto) => c.id === chatId)
    : undefined;
  const isEditing = !!chat;

  const INITIAL_VALUES: CreateChatDto = {
    name: "",
    participantIds: undefined,
    isGroup: isGroup ?? false, // Default to single chat
  };

  // React 19: Memoized initial values with deferred processing
  const initialValues = useMemo(() => {
    if (chat) {
      return strictDeepMerge<CreateChatDto>(
        INITIAL_VALUES,
        {
          name: chat?.name || "",
        } as Partial<CreateChatDto>
      );
    }
    return INITIAL_VALUES;
  }, [chat]);


  const handleClose = useCallback(() => {
    startTransition(() => {
      setAction("", null);
    });
  }, [setAction, startTransition]);

  const mutationFn = useMemo(() => {
    return isEditing && chatId ? (data: Partial<CreateChatDto>) => updateChat(chatId, data) : createChat;
  }, [isEditing, chatId]);

  // React 19: Memoized DTO to prevent unnecessary re-renders
  const dto = useMemo(() => {
    return isEditing ? UpdateChatDto : CreateChatDtoClass;
  }, [isEditing]);

  return (
    <div data-component-id={componentId}>
      <FormHandler<
        CreateChatDto,
        ChatDto,
        IChatFormModalExtraProps
      >
        mutationFn={mutationFn}
        FormComponent={ChatFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({
              queryKey: [storeKey + "-list"],
            });
            handleClose();
          });
        }}
        formProps={{
          open: action === "createOrUpdate",
          onClose: handleClose,
          isGroup: isGroup ?? false,
        }}
      />
    </div>
  );
}

