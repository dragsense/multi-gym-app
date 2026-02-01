import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

import type { TFormHandlerStore } from "@/stores";
import type { TAccessFeatureData, TUpdateAccessFeatureData } from "@shared/types/access-feature.type";
import type { TAccessFeatureResponse } from "@shared/interfaces/access-feature.interface";

import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

export interface IAccessFeaturesFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IAccessFeaturesFormModalProps extends THandlerComponentProps<TFormHandlerStore<TAccessFeatureData, TAccessFeatureResponse, IAccessFeaturesFormModalExtraProps>> {
}

const AccessFeaturesFormModal = React.memo(function AccessFeaturesFormModal({
  storeKey,
  store,
}: IAccessFeaturesFormModalProps) {
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
    name: {
      ...(storeFields as TFieldConfigObject<TAccessFeatureData>).name,
      label: buildSentence(t, 'name'),
      placeholder: buildSentence(t, 'enter', 'name'),
    },
    description: {
      ...(storeFields as TFieldConfigObject<TAccessFeatureData>).description,
      label: buildSentence(t, 'description'),
      placeholder: buildSentence(t, 'enter', 'description'),
    },
  } as TFieldConfigObject<TAccessFeatureData>), [storeFields, t]);

  const inputs = useInput<TAccessFeatureData | TUpdateAccessFeatureData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TAccessFeatureData | TUpdateAccessFeatureData>;

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
        {t('cancel')}
      </Button>
      <Button type="submit" disabled={isSubmitting} data-component-id={componentId}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? t('update') : t('add')}
      </Button>
    </div>
  ), [componentId, isEditing, onClose, isSubmitting, t]);

  return (
    <>
      <ModalForm<TAccessFeatureData, TAccessFeatureResponse, IAccessFeaturesFormModalExtraProps>
        title={buildSentence(t, isEditing ? 'edit' : 'add', 'access', 'features')}
        description={buildSentence(t, isEditing ? 'edit' : 'add', 'a', 'new', 'access', 'features')}
        open={open}
        onOpenChange={onOpenChange}
        formStore={store}
        footerContent={formButtons}
        width="2xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {inputs.name}
          </div>
          <div>
            {inputs.description}
          </div>
        </div>
      </ModalForm>
    </>
  );
});

export default AccessFeaturesFormModal;

