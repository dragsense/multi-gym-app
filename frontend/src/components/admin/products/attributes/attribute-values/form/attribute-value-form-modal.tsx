import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { EAttributeType } from "@shared/enums/products/attribute-type.enum";
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TAttributeValueData } from "@shared/types/products/attribute-value.type";
import type { TFieldType } from "@shared/types/form/field.type";
import type { IAttribute } from "@shared/interfaces/products/attribute.interface";

export interface IAttributeValueFormModalExtraProps {
  open: boolean;
  onClose: () => void;
  attribute?: IAttribute;
}

interface IAttributeValueFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<TAttributeValueData, unknown, IAttributeValueFormModalExtraProps>
  > {}

export default function AttributeValueFormModal({ storeKey, store }: IAttributeValueFormModalProps) {
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

  const isEditing = store((s) => s.isEditing);
  const isSubmitting = store((s) => s.isSubmitting);
  const open = store((s) => s.extra.open);
  const onClose = store((s) => s.extra.onClose);
  const attribute = store((s) => s.extra.attribute);
  const storeFields = store((s) => s.fields);

  // Map attribute type to field type
  const getFieldTypeForAttributeType = (attrType?: EAttributeType): TFieldType => {
    if (!attrType) return "text";
    
    switch (attrType) {
      case EAttributeType.COLOR:
        return "color";
      default:
        return "text";
    }
  };

  const valueFieldType = useMemo(
    () => getFieldTypeForAttributeType(attribute?.type),
    [attribute?.type]
  );

  const getPlaceholderForFieldType = (fieldType: TFieldType): string => {
    switch (fieldType) {
      case "color":
        return t("selectColor") || "Select color (comma-separated for multiple)";
      default:
        return "e.g. Red, Blue, XL (comma-separated for multiple values)";
    }
  };

  const fields = useMemo(
    () => ({
      ...storeFields,
      value: {
        ...(storeFields as TFieldConfigObject<TAttributeValueData>).value,
        type: valueFieldType,
        label: t("value") || "Value",
        placeholder: getPlaceholderForFieldType(valueFieldType),
        ...(valueFieldType === "number" && {
          min: 0,
          step: 0.01,
        }),
      },
      description: {
        ...(storeFields as TFieldConfigObject<TAttributeValueData>).description,
        label: t("description") || "Description",
        placeholder: "Enter description (optional)",
      },
      attribute: attribute
        ? {
            ...(storeFields as TFieldConfigObject<TAttributeValueData>).attribute,
            value: attribute,
            hidden: true,
          }
        : (storeFields as TFieldConfigObject<TAttributeValueData>).attribute,
    }),
    [storeFields, t, attribute, valueFieldType]
  );

  const inputs = useInput<TAttributeValueData>({ fields, showRequiredAsterisk: true });

  const onOpenChange = (state: boolean) => {
    if (!state) startTransition(onClose);
  };

  // When attributeId is from context, keep attribute registered but hidden so it's included in submit
  const attributeInput = attribute ? (inputs as any).attribute : null;

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
    <ModalForm<TAttributeValueData, unknown, IAttributeValueFormModalExtraProps>
      title={
        isEditing
          ? buildSentence(t, "edit", "attribute", "value")
          : buildSentence(t, "add", "attribute", "value")
      }
      description={isEditing ? "Edit attribute value." : "Add values separated by commas to create multiple (e.g. Red, Blue, Green)."}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={footer}
      width="lg"
      data-component-id={componentId}
    >
      <div className="space-y-4">
        {attributeInput && <div className="hidden">{attributeInput}</div>}
        {(inputs as any).value}
        {(inputs as any).description}
      </div>
    </ModalForm>
  );
}
