// React
import React, { useId, useMemo, useTransition } from 'react';

// Types
import { type TForgotPasswordData } from '@shared/types/auth.type';
import { type IMessageResponse } from '@shared/interfaces/api/response.interface';
import { type TFormHandlerStore } from '@/stores';
import { type THandlerComponentProps } from '@/@types/handler-types';

// External Libraries
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';
import { Form } from '@/components/form-ui/form';

// Hooks
import { type FormInputs, useInput } from '@/hooks/use-input';
import { useI18n } from '@/hooks/use-i18n';

// Stores
import { AppCard } from '../layout-ui/app-card';
import { PUBLIC_ROUTES } from '@/config/routes.config';

interface IForgotPasswordFormProps extends THandlerComponentProps<TFormHandlerStore<TForgotPasswordData, IMessageResponse, any>> {
}

const ForgotPasswordForm = React.memo(function ForgotPasswordForm({
  storeKey,
  store,
}: IForgotPasswordFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const { t } = useI18n();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isSubmitting = store(state => state.isSubmitting);

  // React 19: Memoized fields for better performance
  const fields = store(state => state.fields);

  const inputs = useInput<TForgotPasswordData>({
    fields: fields as any,
    showRequiredAsterisk: true,
  }) as FormInputs<TForgotPasswordData>;

  return (
    <Form<TForgotPasswordData, IMessageResponse>
      formStore={store}
    >
      <AppCard
        header={
          <>
            <h2 className="text-md font-semibold">{t("forgotPasswordHeading")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("forgotPasswordSubheading")}
            </p>
          </>
        }
        footer={
          <div className="flex flex-col gap-4 w-full">
            <Button type="submit" className="w-full" disabled={isSubmitting} data-component-id={componentId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("sendResetInstructions")}
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t("rememberPasswordPrompt")}{" "}
                <Link to={PUBLIC_ROUTES.LOGIN} className="hover:underline">
                  {t("loginLinkLabel")}
                </Link>
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 w-full">
          {inputs.email}
        </div>
      </AppCard>
    </Form>
  );
});

export default ForgotPasswordForm;