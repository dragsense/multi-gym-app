// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import type { ITicket } from "@shared/interfaces/ticket.interface";
import type { TTicketData } from "@shared/types/ticket.type";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { TicketFormModal } from "@/components/admin/tickets";
import type { ITicketFormModalExtraProps } from "@/components/admin/tickets";

// Services
import { createTicket, updateTicket } from "@/services/ticket.api";
import { strictDeepMerge } from "@/utils";
import { ETicketStatus, ETicketPriority, ETicketCategory } from "@shared/enums/ticket.enum";
import { CreateTicketDto, UpdateTicketDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface ITicketFormProps extends THandlerComponentProps<TSingleHandlerStore<ITicket, any>> {}

export default function TicketForm({ storeKey, store }: ITicketFormProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();

  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  const { action, response, isLoading, setAction, reset } = store(
    useShallow((state) => ({
      action: state.action,
      response: state.response,
      isLoading: state.isLoading,
      setAction: state.setAction,
      reset: state.reset,
    }))
  );

  const INITIAL_VALUES: TTicketData = {
    title: "",
    description: "",
    status: ETicketStatus.OPEN,
    priority: ETicketPriority.MEDIUM,
    category: ETicketCategory.GENERAL,
  };

  const initialValues = useMemo(() => {
    return strictDeepMerge<TTicketData>(INITIAL_VALUES, response ?? {});
  }, [INITIAL_VALUES, response?.id]);

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    return isEditing && response?.id
      ? (data: TTicketData) => updateTicket(response.id)(data)
      : createTicket;
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateTicketDto : CreateTicketDto;
  }, [isEditing]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<TTicketData, ITicket, ITicketFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={TicketFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
            queryClient.invalidateQueries({ queryKey: [storeKey] });
            handleClose();
          });
        }}
        formProps={{
          open: action === "createOrUpdate",
          onClose: handleClose,
        }}
      />
    </div>
  );
}
