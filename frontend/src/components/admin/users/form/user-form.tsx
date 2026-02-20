// External Libraries
import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TFormHandlerStore } from "@/stores";
import type {
  TUserData,
  TUpdateUserData,
  TProfileData,
} from "@shared/types/user.type";
import type { TUserResponse } from "@shared/interfaces/user.interface";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import { AppCard } from "@/components/layout-ui/app-card";
import { Form } from "@/components/form-ui/form";
import { FormErrors } from "@/components/shared-ui/form-errors";

interface IUserFormProps
  extends THandlerComponentProps<TFormHandlerStore<TUserData, TUserResponse>> {}

const UserForm = React.memo(function UserForm({
  storeKey,
  store,
}: IUserFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const { t } = useI18n();

  if (!store) {
    return `${buildSentence(t, "form", "store")} "${storeKey}" ${buildSentence(t, "not", "found")}. ${buildSentence(t, "did", "you", "forget", "to", "register", "it")}?`;
  }

  const isSubmitting = store((state) => state.isSubmitting);
  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields);

  // React 19: Memoized fields with translated labels and placeholders for account/settings
  const fields = useMemo(
    () =>
      ({
        ...storeFields,
        email: {
          ...storeFields.email,
          label: t("email"),
          disabled: true,
        },
        firstName: {
          ...storeFields.firstName,
          label: t("FirstName"),
          placeholder: buildSentence(t, "enter", "first", "name"),
        },
        lastName: {
          ...storeFields.lastName,
          label: t("LastName"),
          placeholder: buildSentence(t, "enter", "last", "name"),
        },
        dateOfBirth: {
          ...storeFields.dateOfBirth,
          label: t("dateOfBirth"),
          placeholder: t("selectDate"),
        },
        gender: {
          ...storeFields.gender,
          label: t("gender"),
          placeholder: t("selectGender"),
        },
      } as TFieldConfigObject<TUserData>),
    [storeFields, t]
  );

  const inputs = useInput<TUserData | TUpdateUserData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TUserData | TUpdateUserData>;

  return (
    <Form<TUserData | TUpdateUserData, TUserResponse> formStore={store}>
      <div data-component-id={componentId} className="space-y-6">
        <AppCard
          header={
            <>
              <h2 className="text-md font-semibold">{t("userInformation")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("updateYourUserInformation")}
              </p>
            </>
          }
          footer={
            <div className="flex justify-end gap-2 mt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("updateUser")}
              </Button>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start max-w-lg">
            <div className="col-span-2">{inputs.email} </div>

            {inputs.firstName}
            {inputs.lastName}
            {inputs.dateOfBirth}
            {inputs.gender}
          </div>
          <FormErrors />
        </AppCard>
      </div>
    </Form>
  );
});

export default UserForm;
