// External Libraries
import React, { useId, useState, useTransition, useMemo } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TUserResetPasswordData } from "@shared/types/user.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/layout-ui/app-card";
import { Form } from "@/components/form-ui/form";

type IPasswordResetFormProps = THandlerComponentProps<
  TFormHandlerStore<TUserResetPasswordData, IMessageResponse>
>;

const PasswordResetForm = React.memo(function PasswordResetForm({
  storeKey,
  store,
}: IPasswordResetFormProps) {
  // All hooks must be called BEFORE any early returns
  // React 19: Essential IDs
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!store) {
    return (
      <div>
        {buildSentence(t, 'form', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?
      </div>
    );
  }

  const isSubmitting = store((state) => state.isSubmitting);
  const originalFields = store((state) => state.fields);

  // React 19: Memoized fields for better performance with password visibility
  const fields = useMemo(() => {
    return {
      ...originalFields,
      currentPassword: {
        ...originalFields.currentPassword,
        label: t('CurrentPassword'),
        placeholder: t('enterCurrentPassword'),
        type: showCurrentPassword ? "text" : "password",
        endAdornment: (
          <button
            type="button"
            onClick={() =>
              startTransition(() =>
                setShowCurrentPassword(!showCurrentPassword)
              )
            }
            className="text-muted-foreground hover:text-foreground"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ),
      },
      password: {
        ...originalFields.password,
        label: t('NewPassword'),
        placeholder: t('enterNewPassword'),
        type: showPassword ? "text" : "password",
        endAdornment: (
          <button
            type="button"
            onClick={() =>
              startTransition(() => setShowPassword(!showPassword))
            }
            className="text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ),
      },
      confirmPassword: {
        ...originalFields.confirmPassword,
        label: t('ConfirmNewPassword'),
        placeholder: t('enterConfirmNewPassword'),
        type: showConfirmPassword ? "text" : "password",
        endAdornment: (
          <button
            type="button"
            onClick={() =>
              startTransition(() =>
                setShowConfirmPassword(!showConfirmPassword)
              )
            }
            className="text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        ),
      },
    } as TFieldConfigObject<TUserResetPasswordData>;
  }, [
    store,
    showCurrentPassword,
    showPassword,
    showConfirmPassword,
    startTransition,
  ]);

  const inputs = useInput<TUserResetPasswordData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TUserResetPasswordData>;

  // Early return check AFTER all hooks

  return (
    <Form<TUserResetPasswordData, IMessageResponse> formStore={store}>
      <div data-component-id={componentId} className="space-y-6">
        <AppCard
          header={
            <>
              <h2 className="text-md font-semibold">{t('passwordReset')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('changeYourAccountPassword')}
              </p>
            </>
          }
          footer={
            <div className="flex justify-end gap-2 mt-6">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('updatePassword')}
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Password Fields */}
            <div>
              <h3 className="text-sm font-semibold mb-3">
                {t('passwordInformation')}
              </h3>
              <div className="grid grid-cols-1 gap-6 items-start max-w-lg">
                {inputs.currentPassword}
                {inputs.password}
                {inputs.confirmPassword}
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </Form>
  );
});

export default PasswordResetForm;
