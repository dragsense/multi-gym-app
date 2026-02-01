import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";
import { FormHandler } from "@/handlers";
import { EVALIDATION_MODES } from "@/enums/form.enums";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TSingleHandlerStore } from "@/stores";
import { AttributeFormModal, type IAttributeFormModalExtraProps } from "@/components/admin/products";
import { createAttribute, updateAttribute } from "@/services/products/attribute.api";
import { strictDeepMerge } from "@/utils";
import { CreateAttributeDto, UpdateAttributeDto } from "@shared/dtos";
import type { TAttributeData } from "@shared/types/products/attribute.type";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IAttributeFormProps
  extends THandlerComponentProps<TSingleHandlerStore<IAttribute, Record<string, unknown>>> {}


export default function AttributeForm({ storeKey, store }: IAttributeFormProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }
  

  const { action, response, isLoading, setAction, reset } = store(
    useShallow((s) => ({
      action: s.action,
      response: s.response,
      isLoading: s.isLoading,
      setAction: s.setAction,
      reset: s.reset,
    }))
  );

  const INITIAL_VALUES: TAttributeData = { name: "", type: "" };


  const initialValues = useMemo(
    () => strictDeepMerge<TAttributeData>(INITIAL_VALUES, response ?? {}),
    [response]
  );

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;
  const mutationFn = useMemo(
    () => (isEditing && response?.id ? updateAttribute(response.id) : createAttribute),
    [isEditing, response?.id]
  );
  const dto = useMemo(
    () => (isEditing ? UpdateAttributeDto : CreateAttributeDto),
    [isEditing]
  );

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<TAttributeData, IMessageResponse, IAttributeFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={AttributeFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={() => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
            handleClose();
          });
        }}
        formProps={{ open: action === "createOrUpdate", onClose: handleClose }}
      />
    </div>
  );
}
