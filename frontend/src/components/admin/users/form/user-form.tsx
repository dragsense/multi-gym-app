// External Libraries
import React, { useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";
// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";

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

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isSubmitting = store((state) => state.isSubmitting);
  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields);

  // React 19: Memoized fields for better performance
  const fields = useMemo(
    () =>
      ({
        ...storeFields,
        email: {
          ...storeFields.email,
          disabled: true,
        },
      } as TFieldConfigObject<TUserData>),
    [storeFields]
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
              <h2 className="text-md font-semibold">User Information</h2>
              <p className="text-sm text-muted-foreground">
                Update your user information
              </p>
            </>
          }
          footer={
            <div className="flex justify-end gap-2 mt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update User
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
