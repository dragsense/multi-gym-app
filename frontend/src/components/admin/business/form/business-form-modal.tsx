// External Libraries
import React, { useMemo, useId, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TBusinessData, TUpdateBusinessData, TCreateBusinessWithUserData, TUpdateBusinessWithUserData } from "@shared/types";
import type { TUserData } from "@shared/types/user.type";
import type { IMessageResponse } from "@shared/interfaces";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import { addRenderItem } from "@/lib/fields/dto-to-feilds";

export interface IBusinessFormModalExtraProps {
  open: boolean;
  onClose: () => void;
}

interface IBusinessFormModalProps
  extends THandlerComponentProps<
    TFormHandlerStore<
      TBusinessData | TCreateBusinessWithUserData,
      IMessageResponse,
      IBusinessFormModalExtraProps
    >
  > { }

export const BusinessFormModal = React.memo(function BusinessFormModal({
  storeKey,
  store,
}: IBusinessFormModalProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, "form", "store")} "${storeKey}" ${buildSentence(
      t,
      "not",
      "found"
    )}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  const isEditing = store((state) => state.isEditing);
  const open = store((state) => state.extra.open);
  const onClose = store((state) => state.extra.onClose);
  const storeFields = store((state) => state.fields);

  const fields = useMemo(() => {
    const renderers = {
      user: (user: FormInputs<TUserData>) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.email as ReactNode}
            {user.isActive as ReactNode}
            {user.firstName as ReactNode}
            {user.lastName as ReactNode}
            {user.dateOfBirth as ReactNode}
            {user.gender as ReactNode}
          </div>
        </div>
      ),
    };

    const fieldsWithUser = {
      ...storeFields,
      name: {
        ...storeFields.name,
        placeholder: 'Enter business name',
      },
      subdomain: {
        ...storeFields.subdomain,
        placeholder: 'Enter subdomain (e.g., mygym)',
      },
    };

    return addRenderItem(fieldsWithUser, renderers) as TFieldConfigObject<TBusinessData | TCreateBusinessWithUserData | TUpdateBusinessData | TUpdateBusinessWithUserData>;
  }, [storeFields]);

  const inputs = useInput<TBusinessData | TCreateBusinessWithUserData | TUpdateBusinessData | TUpdateBusinessWithUserData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TBusinessData | TCreateBusinessWithUserData | TUpdateBusinessData | TUpdateBusinessWithUserData>;

  const onOpenChange = (state: boolean) => {
    if (!state) {
      startTransition(() => onClose());
    }
  };

  const formButtons = useMemo(
    () => (
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            startTransition(() => onClose());
          }}
          data-component-id={componentId}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={false} data-component-id={componentId}>
          {false && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t("update") : t("add")}
        </Button>
      </div>
    ),
    [componentId, isEditing, onClose, t]
  );

  const userInputs = (inputs as any).user as FormInputs<TUserData> | undefined;

  return (
    <ModalForm<
      TBusinessData | TCreateBusinessWithUserData,
      IMessageResponse,
      IBusinessFormModalExtraProps
    >
      title={buildSentence(t, isEditing ? "Edit" : "Add", "Business")}
      description={buildSentence(t, isEditing ? "Edit" : "Add", "a", "new", "business")}
      open={open}
      onOpenChange={onOpenChange}
      formStore={store}
      footerContent={formButtons}
      width="3xl"
    >
      <div className="space-y-8">
        {/* User Information */}
        {userInputs && (
          <div>
            <h3 className="text-sm font-semibold mb-3">
              {buildSentence(t, "User", "Information")}
            </h3>
            {userInputs as ReactNode}
          </div>
        )}

        {/* Business Information */}
        <div>
          <h3 className="text-sm font-semibold mb-3">
            {buildSentence(t, "Business", "Information")}
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {inputs.name}
            {inputs.subdomain}
          </div>
        </div>
      </div>
    </ModalForm>
  );
});
