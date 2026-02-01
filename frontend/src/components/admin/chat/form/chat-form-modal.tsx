// External Libraries
import React, {
  type ReactNode,
  useMemo,
  useId,
  useTransition,
  useState,
  useEffect,
  useCallback,
} from "react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableUsers } from "@/hooks/use-searchable";
import { Loader2 } from "lucide-react";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { CreateChatDto, ChatDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { UserDto } from "@shared/dtos";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import { Button } from "@/components/ui/button";
import type { THandlerComponentProps } from "@/@types/handler-types";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type {
  TCustomInputWrapper,
  TFieldConfigObject,
} from "@/@types/form/field-config.type";
import { useShallow } from "zustand/react/shallow";
import { FormErrors } from "@/components/shared-ui/form-errors";

export interface IChatFormModalExtraProps {
  open: boolean;
  onClose: () => void;
  isGroup: boolean;
}

interface IChatFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<CreateChatDto, ChatDto, IChatFormModalExtraProps>
  > { }

// Custom component for user multi-select
const UserMultiSelect = React.memo((props: TCustomInputWrapper & { multiple?: boolean }) => {
  const searchableUsers = useSearchableUsers({});
  const { t } = useI18n();
  return (
    <SearchableInputWrapper<UserDto>
      {...props}
      modal={true}
      useSearchable={() => searchableUsers}
      getLabel={(item) => {
        if (!item) return props.multiple ? buildSentence(t, "select", "participants") : buildSentence(t, "select", "user");
        return `${item.firstName || ""} ${item.lastName || ""} (${item.email || ""})`.trim() || item.email || "User";
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return {
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
        };
      }}
      shouldFilter={false}
      multiple={props.multiple !== false}
    />
  );
});

// Custom component for user single select
const UserSingleSelect = React.memo((props: TCustomInputWrapper) => {
  return <UserMultiSelect {...props} multiple={false} />;
});

const ChatFormModal = React.memo(function ChatFormModal({
  storeKey,
  store,
}: IChatFormModalProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Always call hooks unconditionally
  const { isEditing, isSubmitting, extra, fields: storeFields } = store
    ? store(
      useShallow((state) => ({
        isEditing: state.isEditing,
        isSubmitting: state.isSubmitting,
        extra: state.extra,
        fields: state.fields,
      }))
    )
    : { isEditing: false, isSubmitting: false, extra: { open: false, onClose: () => { } }, fields: {} };

  const open = extra.open;
  const onClose = extra.onClose;
  const isGroup = extra.isGroup;

  // React 19: Memoized fields for better performance
  const fields = useMemo(
    () =>
    ({
      ...(storeFields as TFieldConfigObject<CreateChatDto>),
      name: {
        ...(storeFields as TFieldConfigObject<CreateChatDto>).name,
        label: buildSentence(t, "chat", "name"),
        required: isGroup && !isEditing,
      },
      participantIds: {
        ...(storeFields as TFieldConfigObject<CreateChatDto>).participantIds,
        label: isGroup ? buildSentence(t, "participants") : buildSentence(t, "select", "user"),
        type: "custom" as const,
        Component: isGroup ? UserMultiSelect : UserSingleSelect,
        required: !isEditing,
      },
    } as TFieldConfigObject<CreateChatDto>),
    [storeFields, t, isEditing, isGroup]
  );

  const inputs = useInput<CreateChatDto>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<CreateChatDto>;

  // React 19: Smooth modal state changes
  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

  // Form buttons with submit and cancel
  const formButtons = useMemo(
    () => (
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => {
              onClose();
            });
          }}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing
            ? buildSentence(t, "update", "chat")
            : buildSentence(t, "create", "chat")}
        </Button>
      </div>
    ),
    [onClose, isSubmitting, isEditing, t, startTransition]
  );

  // Early return check - must be after all hooks
  if (!store) {
    return (
      <div>
        {buildSentence(t, "form", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  return (
    <ModalForm<CreateChatDto, ChatDto, IChatFormModalExtraProps>
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEditing
          ? buildSentence(t, "edit", "chat")
          : buildSentence(t, "create", "chat")
      }
      formStore={store}
      footerContent={formButtons}
      width="md"
    >
      <div className="space-y-4">
        {!isEditing && inputs.participantIds as ReactNode}
        {isGroup && inputs.name}
      </div>
      <FormErrors />
    </ModalForm>
  );
});

export { ChatFormModal };
