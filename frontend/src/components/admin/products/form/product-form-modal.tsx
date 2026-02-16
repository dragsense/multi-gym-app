import React, { useId, useMemo, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { useInput } from "@/hooks/use-input";
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TProductData, TUpdateProductData } from "@shared/types/products/product.type";
import MultiFileUpload from "@/components/shared-ui/multi-file-upload";
import { useSearchableProductTypes } from "@/hooks/use-searchable";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { VariantsMatrix, type VariantRow } from "@/components/admin/products/variants";
import type { IProductType } from "@shared/interfaces";
import { FormErrors } from "@/components/shared-ui/form-errors";

export interface IProductFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IProductFormModalProps
  extends THandlerComponentProps<TFormHandlerStore<TProductData | TUpdateProductData, IMessageResponse, IProductFormModalExtraProps>> { }

const DefaultImagesInput = React.memo(
  ({ value, onChange }: { value?: File[]; onChange: (files: File[]) => void }) => (
    <MultiFileUpload
      value={value ?? []}
      onChange={onChange}
      maxFiles={10}
      maxSizeInMB={10}
      acceptedTypes={["image/jpeg", "image/jpg", "image/png", "image/webp"]}
    />
  )
);

// Custom components - must be defined before early return
const ProductTypeSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableTrainers = useSearchableProductTypes({});
  return (
    <SearchableInputWrapper<IProductType>
      {...props}
      modal={true}
      useSearchable={() => searchableTrainers}
      getLabel={(item) => {
        if (!item?.name) return null;
        return item.name;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return { id: item.id, name: item.name };
      }}
      shouldFilter={false}
    />
  );
});

export default function ProductFormModal({ storeKey, store }: IProductFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return (
      <div>
        {buildSentence(t, "form", "store")} "{storeKey}" {buildSentence(t, "not", "found")}.
      </div>
    );
  }

  const open = store((s) => s.extra.open);
  const onClose = store((s) => s.extra.onClose);
  const fields = store((s) => s.fields);
  const isSubmitting = store((s) => s.isSubmitting);
  const isEditing = store((s) => s.isEditing);


  const memoizedFields = useMemo(() => {
    const storeFields = fields as TFieldConfigObject<TProductData | TUpdateProductData>;
    return {
      ...storeFields,
      defaultImages: {
        ...storeFields.defaultImages,
        label: t("defaultImages"),
        placeholder: t("defaultImages"),
        type: "custom" as const,
        Component: ({ value, onChange }: { value?: File[]; onChange: (v: File[]) => void }) => (
          <DefaultImagesInput value={value} onChange={onChange} />
        ),
      },
      name: { ...storeFields.name, label: t("name"), placeholder: t("productName") },
      productType: {
        ...storeFields.productType, label: t("productType"), placeholder: t("selectProductType"), type: "custom" as const, Component: ({ value, onChange }: { value?: IProductType; onChange: (v: IProductType) => void }) => (
          <ProductTypeSelect value={value} onChange={onChange} />
        )
      },
      variants: {
        ...storeFields.variants,
        label: t("variants"),
        placeholder: t("variants"),
        type: "custom" as const,
        Component: ({ value, onChange }: { value?: VariantRow[]; onChange: (v: VariantRow[]) => void }) => (
          <VariantsMatrix
            value={value ?? []}
            onChange={(v) => {
              console.log("v", v);
              onChange(v);
            }}
            isEditing={isEditing}
            disabled={isSubmitting}
          />
        ),
      },
      defaultSku: { ...storeFields.defaultSku, label: t("defaultSku"), placeholder: t("defaultSku") },
      description: { ...storeFields.description, label: t("description"), placeholder: t("description") },
      defaultPrice: { ...storeFields.defaultPrice, label: t("defaultPrice"), placeholder: "0" },
      totalQuantity: { ...storeFields.totalQuantity, label: t("totalQuantity"), placeholder: "0" },
      isActive: { ...storeFields.isActive, label: t("isActive") },
    } as unknown as TFieldConfigObject<TProductData | TUpdateProductData>;
  }, [fields, t, isEditing, isSubmitting]);

  const inputs = useInput<TProductData | TUpdateProductData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  });

  const onOpenChange = (state: boolean) => {
    if (!state) startTransition(() => onClose());
  };

  const footer = useMemo(
    () => (
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => startTransition(onClose)}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t("update") : t("create")}
        </Button>
      </div>
    ),
    [onClose, isSubmitting, isEditing, t, startTransition]
  );

  return (
    <ModalForm<TProductData | TUpdateProductData, IMessageResponse, IProductFormModalExtraProps>
      title={isEditing ? t("updateProduct") : t("createProduct")}
      description={isEditing ? t("updateProductDetails") : t("createNewProduct")}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={footer}
      width="7xl"
      data-component-id={componentId}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("productDetails")}</h3>
            <div className="grid grid-cols-1 gap-4">
              {inputs.name as React.ReactNode}
              {inputs.description as React.ReactNode}
              {inputs.productType as React.ReactNode}
              {inputs.isActive as React.ReactNode}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3">{t("images")}</h3>
            {inputs.defaultImages as React.ReactNode}
          </div>
        </div>
        <div className="space-y-6">

          <div>
            <h3 className="text-sm font-semibold mb-3">{t("variants")}</h3>
            <div className="space-y-4">
              {inputs.defaultSku as React.ReactNode}
              {inputs.defaultPrice as React.ReactNode}
              {inputs.totalQuantity as React.ReactNode}
              {inputs.variants as React.ReactNode}

            </div>
          </div>
        </div>
      </div>
      <FormErrors />

    </ModalForm>
  );
}
