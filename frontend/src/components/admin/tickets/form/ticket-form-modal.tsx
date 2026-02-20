// React & Hooks
import React, { useId, useTransition, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { ITicket } from "@shared/interfaces/ticket.interface";
import type { TTicketData, TUpdateTicketData } from "@shared/types/ticket.type";
import type { TFormHandlerStore } from "@/@types/handler-types";
import {
  ETicketStatus,
  ETicketPriority,
  ETicketCategory,
} from "@shared/enums/ticket.enum";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInput } from "@/hooks/use-input";
import type { TFieldConfigObject } from "@/@types/form-types";
import type { FormInputs } from "@/@types/form-types";

export interface ITicketFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface ITicketFormModalProps extends React.ComponentPropsWithoutRef<
  typeof ModalForm<TTicketData, ITicket, ITicketFormModalExtraProps>
> {
  storeKey: string;
  store: TFormHandlerStore<TTicketData, ITicket, ITicketFormModalExtraProps>;
}

const TicketFormModal = React.memo(function TicketFormModal({
  storeKey,
  store,
}: ITicketFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, "form", "store")} "${storeKey}" ${buildSentence(t, "not", "found")}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  const isEditing = store((state) => state.isEditing);
  const isSubmitting = store((state) => state.isSubmitting);
  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const storeFields = store((state) => state.fields);

  const fields = useMemo(
    () =>
      ({
        ...storeFields,
      }) as TFieldConfigObject<TTicketData>,
    [storeFields, isEditing],
  );

  const inputs = useInput<TTicketData | TUpdateTicketData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TTicketData | TUpdateTicketData>;

  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

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
          data-component-id={componentId}
        >
          {buildSentence(t, "cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          data-component-id={componentId}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? buildSentence(t, "update") : buildSentence(t, "create")}
        </Button>
      </div>
    ),
    [componentId, isEditing, isSubmitting, onClose, t],
  );

  return (
    <ModalForm<TTicketData, ITicket, ITicketFormModalExtraProps>
      title={buildSentence(t, isEditing ? "edit" : "create", "ticket")}
      // description={buildSentence(t, isEditing ? "update" : "create", "a", "new", "ticket")}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="2xl"
    >
      {inputs.title}
      {inputs.description}
      {inputs.category}
      {inputs.priority}
    </ModalForm>
  );
});

export default TicketFormModal;
