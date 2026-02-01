import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";
import { FormHandler } from "@/handlers";
import { EVALIDATION_MODES } from "@/enums/form.enums";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IProductType } from "@shared/interfaces/products/product-type.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TSingleHandlerStore } from "@/stores";
import { ProductTypeFormModal, type IProductTypeFormModalExtraProps } from "@/components/admin/products";
import { createProductType, updateProductType } from "@/services/products/product-type.api";
import { strictDeepMerge } from "@/utils";
import { CreateProductTypeDto, UpdateProductTypeDto } from "@shared/dtos";
import type { TProductTypeData } from "@shared/types/products/product-type.type";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IProductTypeFormProps
  extends THandlerComponentProps<TSingleHandlerStore<IProductType, Record<string, unknown>>> {}


export default function ProductTypeForm({ storeKey, store }: IProductTypeFormProps) {
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

  const INITIAL_VALUES: TProductTypeData = { name: "" };


  const initialValues = useMemo(
    () => strictDeepMerge<TProductTypeData>(INITIAL_VALUES, response ?? {}),
    [INITIAL_VALUES, response]
  );

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;
  const mutationFn = useMemo(
    () => (isEditing && response?.id ? updateProductType(response.id) : createProductType),
    [isEditing, response?.id]
  );
  const dto = useMemo(
    () => (isEditing ? UpdateProductTypeDto : CreateProductTypeDto),
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
      <FormHandler<TProductTypeData, IMessageResponse, IProductTypeFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={ProductTypeFormModal}
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
