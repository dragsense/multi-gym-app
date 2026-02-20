// React & Hooks
import React, { useId, useTransition, useMemo } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { IFaq } from "@shared/interfaces/cms.interface";
import type { TCreateFaqData, TUpdateFaqData } from "@shared/types/cms.type";
import type { TFormHandlerStore } from "@/stores";

// Components
import { ModalForm } from "@/components/form-ui/modal-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInput } from "@/hooks/use-input";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import type { FormInputs } from "@/hooks/use-input";

export interface IFaqFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IFaqFormModalProps extends React.ComponentPropsWithoutRef<
  typeof ModalForm<TCreateFaqData, IFaq, IFaqFormModalExtraProps>
> {
  storeKey: string;
  store: TFormHandlerStore<TCreateFaqData, IFaq, IFaqFormModalExtraProps>;
}

const FaqFormModal = React.memo(function FaqFormModal({
  storeKey,
  store,
}: IFaqFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, 'form', 'store')} "${storeKey}" ${buildSentence(t, 'not', 'found')}. ${buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?`;
  }

  const isEditing = store((state) => state.isEditing);
  const isSubmitting = store((state) => state.isSubmitting);
  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const storeFields = store((state) => state.fields);

  const fields = useMemo(() => ({
    ...storeFields,
    question: {
      ...storeFields.question,
      placeholder: buildSentence(t, "enter", "question"),
    },
    answer: {
      ...storeFields.answer,
      placeholder: buildSentence(t, "enter", "answer"),
    },
  } as TFieldConfigObject<TCreateFaqData>), [storeFields, isEditing]);

  const inputs = useInput<TCreateFaqData | TUpdateFaqData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateFaqData | TUpdateFaqData>;

  const onOpenChange = (state: boolean) => {
    if (state === false) {
      startTransition(() => {
        onClose();
      });
    }
  };

  const formButtons = useMemo(() => (
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
        {buildSentence(t, 'cancel')}
      </Button>
      <Button type="submit" disabled={isSubmitting} data-component-id={componentId}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? buildSentence(t, 'update') : buildSentence(t, 'create')}
      </Button>
    </div>
  ), [componentId, isEditing, isSubmitting, onClose, t]);

  return (
    <ModalForm<TCreateFaqData, IFaq, IFaqFormModalExtraProps>
      title={buildSentence(t, isEditing ? "edit" : "create", "faq")}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="2xl"
    >
      {inputs.question}
      {inputs.answer}
      {inputs.enabled}
    </ModalForm>
  );
});

export default FaqFormModal;
