import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";
import { FormHandler } from "@/handlers";
import { EVALIDATION_MODES } from "@/enums/form.enums";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IAttributeValue } from "@shared/interfaces/products/attribute-value.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TSingleHandlerStore } from "@/stores";
import { AttributeValueFormModal, type IAttributeValueFormModalExtraProps } from "@/components/admin/products";
import { createAttributeValue, updateAttributeValue } from "@/services/products/attribute-value.api";
import { strictDeepMerge } from "@/utils";
import { CreateAttributeValueDto, UpdateAttributeValueDto } from "@shared/dtos";
import type { TAttributeValueData } from "@shared/types/products/attribute-value.type";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";

export type TAttributeValuesExtraProps = { attribute?: IAttribute };

interface IAttributeValueFormProps
  extends THandlerComponentProps<TSingleHandlerStore<IAttributeValue, TAttributeValuesExtraProps>> { }

export default function AttributeValueForm({ storeKey, store }: IAttributeValueFormProps) {
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

  const { action, response, isLoading, setAction, reset, extra } = store(
    useShallow((s) => ({
      action: s.action,
      response: s.response,
      isLoading: s.isLoading,
      setAction: s.setAction,
      reset: s.reset,
      extra: s.extra,
    }))
  );

  const attribute = extra?.attribute;

  const INITIAL_VALUES: TAttributeValueData = {
    value: "",
    description: "",
    ...(attribute && { attribute: { id: attribute.id } }),
  };

  const initialValues = useMemo(() => {
    return strictDeepMerge<TAttributeValueData>(INITIAL_VALUES, response ?? {});
  }, [response]);

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;
  const mutationFn = useMemo(
    () => (isEditing && response?.id ? updateAttributeValue(response.id) : createAttributeValue),
    [isEditing, response?.id]
  );
  const dto = useMemo(
    () => (isEditing ? UpdateAttributeValueDto : CreateAttributeValueDto),
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
      <FormHandler<TAttributeValueData, IMessageResponse, IAttributeValueFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={AttributeValueFormModal}
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
        formProps={{
          open: action === "createOrUpdate",
          onClose: handleClose,
          attribute,
        }}
      />
    </div>
  );
}
