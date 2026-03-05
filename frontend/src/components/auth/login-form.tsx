// React
import React, { useState, useId, useMemo, useTransition } from 'react';

// Types
import { type TLoginData } from '@shared/types/auth.type';
import { type ILoginResponse } from '@shared/interfaces/auth.interface';
import type { BusinessDto } from '@shared/dtos';
import { type TFormHandlerStore } from '@/stores';
import { type THandlerComponentProps } from '@/@types/handler-types';
import type {
  TCustomInputWrapper,
  TFieldConfigObject,
} from "@/@types/form/field-config.type";


// External Libraries
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// Components
import { Button } from '@/components/ui/button';
import { Form } from '@/components/form-ui/form';
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";

// Hooks
import { type FormInputs, useInput } from '@/hooks/use-input';
import { AppCard } from '../layout-ui/app-card';
import { useI18n } from '@/hooks/use-i18n';
import { useSearchableBusiness } from "@/hooks/use-searchable";

// Stores
import { PUBLIC_ROUTES } from '@/config/routes.config';

import { buildSentence } from "@/locales/translations";


interface ILoginFormProps extends THandlerComponentProps<TFormHandlerStore<TLoginData, ILoginResponse, any>> {
}

// Custom component - must be defined before early return
const BusinessSelect = React.memo((props: TCustomInputWrapper) => {
  const searchableBusinesses = useSearchableBusiness({});
  const { t } = useI18n();
  return (
    <SearchableInputWrapper<BusinessDto>
      {...props}
      modal={true}
      useSearchable={() => searchableBusinesses}
      getLabel={(item) => {
        if (!item) return buildSentence(t, "select", "tenant");
        return `${item.name}`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return {
          id: item.id,
          tenantId: item.tenantId,
          name: item.name,
        };
      }}
      shouldFilter={false}
    />
  );
});

const LoginForm = React.memo(function LoginForm({
  storeKey,
  store,
}: ILoginFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isSubmitting = store(state => state.isSubmitting);
  const [showPassword, setShowPassword] = useState(false);

  const originalFields = store(state => state.fields);

  // React 19: Memoized fields for better performance
  const fields = useMemo(() => ({
    ...originalFields,
    email: {
      ...originalFields.email,
      placeholder: t("Enter Email"),
    },
    business: {
      ...originalFields.business,
      type: 'custom',
      Component: BusinessSelect,
      placeholder: t("Enter Tenant ID"),
    },
    password: {
      ...originalFields.password,
      type: showPassword ? "text" : "password",
      placeholder: t("Enter Password"),
      endAdornment: (
        <button
          type="button"
          onClick={() => startTransition(() => setShowPassword(!showPassword))}
          className="text-muted-foreground hover:text-foreground"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      ),
      bottomAdornment: (
        <p className="text-sm text-muted-foreground">
          {`${t("forgotPasswordPrompt")}`}{" "}
          <Link to={PUBLIC_ROUTES.FORGOT_PASSWORD} className="hover:underline">
            {t("resetPasswordLink")}
          </Link>
        </p>
      )
    }
  }), [originalFields, showPassword, t]);



  const inputs = useInput<TLoginData>({
    fields: fields as TFieldConfigObject<TLoginData>,
    showRequiredAsterisk: true,
  }) as FormInputs<TLoginData>;

  return (
    <Form<TLoginData, ILoginResponse>
      formStore={store}
    >
      <AppCard
        header={
          <>
            <h2 className="text-md font-semibold">{t("loginHeading")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("loginSubheading")}
            </p>
          </>
        }
        footer={
          <div className="flex flex-col gap-4 w-full">
            <Button type="submit" className="w-full" disabled={isSubmitting} data-component-id={componentId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("login")}
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t("dontHaveAccountPrompt")}{" "}
                <Link to={PUBLIC_ROUTES.SIGNUP} className="hover:underline">
                  {t("signupCta")}
                </Link>
              </p>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-4 w-full">
          {inputs.email}
          {inputs.password}
          {inputs.business}
        </div>
      </AppCard>
    </Form>
  );
});

export default LoginForm;