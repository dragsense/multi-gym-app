import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { TAttributeData } from "@shared/types/products/attribute.type";

export interface IAttributeFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IAttributeFormModalProps
  extends THandlerComponentProps<TFormHandlerStore<TAttributeData, unknown, IAttributeFormModalExtraProps>> {}

export default function AttributeFormModal({ storeKey, store }: IAttributeFormModalProps) {
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
  const storeFields = store((s) => s.fields);

  const fields = useMemo(
    () => ({
      ...storeFields,
      name: {
        ...(storeFields as TFieldConfigObject<TAttributeData>).name,
        label: t("name"),
        placeholder: "Enter name (e.g. Color, Size)",
      },
      type: {
        ...(storeFields as TFieldConfigObject<TAttributeData>).type,
        label: t("type") || "Type",
        placeholder: t("selectType") || "Select attribute type",
      },
    }),
    [storeFields, t]
  );

  const inputs = useInput<TAttributeData>({ fields, showRequiredAsterisk: true });

  const onOpenChange = (state: boolean) => {
    if (!state) startTransition(onClose);
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
    <ModalForm<TAttributeData, unknown, IAttributeFormModalExtraProps>
      title={
        isEditing
          ? buildSentence(t, "edit", "attribute")
          : buildSentence(t, "add", "attribute")
      }
      description={isEditing ? "Edit attribute." : "Add a new attribute (e.g. Color, Size)."}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={footer}
      width="lg"
      data-component-id={componentId}
    >
      <div className="space-y-4">
        {(inputs as any).name}
        {(inputs as any).type}
      </div>
    </ModalForm>
  );
}
