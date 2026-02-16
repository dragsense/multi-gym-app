import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";
import { FormHandler } from "@/handlers";
import { EVALIDATION_MODES } from "@/enums/form.enums";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IProduct } from "@shared/interfaces/products/product.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TSingleHandlerStore } from "@/stores";
import { ProductFormModal, type IProductFormModalExtraProps } from "@/components/admin/products";
import { createProduct, updateProduct } from "@/services/products/product.api";
import { strictDeepMerge } from "@/utils";
import { CreateProductDto, UpdateProductDto } from "@shared/dtos";
import type { TProductData, TUpdateProductData } from "@shared/types/products/product.type";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TProductFormExtraProps = Record<string, unknown>;

interface IProductFormProps
  extends THandlerComponentProps<TSingleHandlerStore<IProduct, TProductFormExtraProps>> {}


export default function ProductForm({ storeKey, store }: IProductFormProps) {
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

  const INITIAL_VALUES: TProductData = {
    name: "",
    description: "",
    defaultSku: "SKU",
    defaultPrice: 0,
    totalQuantity: 0,
    defaultImages: [],
    productType: null,
    variants: [],
    isActive: true,
  };
  

  const initialValues = useMemo(
    () => strictDeepMerge<TProductData | TUpdateProductData>(INITIAL_VALUES, response ?? {}),
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
    () => (isEditing && response?.id ? updateProduct(response.id) : createProduct),
    [isEditing, response?.id]
  );
  const dto = useMemo(
    () => (isEditing ? UpdateProductDto : CreateProductDto),
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
      <FormHandler<TProductData | TUpdateProductData, IMessageResponse, IProductFormModalExtraProps>
        mutationFn={mutationFn}
        FormComponent={ProductFormModal}
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
        }}
      />
    </div>
  );
}
