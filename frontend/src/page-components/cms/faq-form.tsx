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
import type { IFaq } from "@shared/interfaces/cms.interface";
import type { TCreateFaqData, TUpdateFaqData } from "@shared/types/cms.type";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { FaqFormModal, type IFaqFormModalExtraProps } from "@/components/admin/cms/faqs";

// Services
import { createFaq, updateFaq } from "@/services/cms.api";
import { strictDeepMerge } from "@/utils";
import { CreateFaqDto, UpdateFaqDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IFaqFormProps extends THandlerComponentProps<TSingleHandlerStore<IFaq, any>> {}

export default function FaqForm({ storeKey, store }: IFaqFormProps) {
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

  const INITIAL_VALUES: TCreateFaqData = {
    question: "",
    answer: "",
    enabled: true,
  };

  const initialValues = useMemo(() => {
    return strictDeepMerge<TCreateFaqData>(INITIAL_VALUES, response ?? {});
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
      ? (data: TCreateFaqData) => updateFaq(response.id)(data)
      : createFaq;
  }, [isEditing, response?.id]);

  const dto = useMemo(() => {
    return isEditing ? UpdateFaqDto : CreateFaqDto;
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
      <FormHandler<TCreateFaqData, IFaq, IFaqFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={FaqFormModal}
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
