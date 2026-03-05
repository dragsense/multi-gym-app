// React
import React, {
  useState,
  useId,
  useMemo,
  useTransition,
  type ReactNode,
} from "react";

// Types
import { type TSignupData } from "@shared/types/auth.type";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { type TFormHandlerStore } from "@/stores";
import { type THandlerComponentProps } from "@/@types/handler-types";
import type { BusinessDto } from '@shared/dtos';

import type {
  TCustomInputWrapper,
  TFieldConfigObject,
} from "@/@types/form/field-config.type";

// External Libraries
import { Eye, EyeOff, Mail, Loader2, User } from "lucide-react";
import { Link } from "react-router-dom";

// Components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form-ui/form";
import { AppCard } from "../layout-ui/app-card";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";

// Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useI18n } from "@/hooks/use-i18n";
import { useSearchableBusiness } from "@/hooks/use-searchable";

import { PUBLIC_ROUTES } from "@/config/routes.config";
import { buildSentence } from "@/locales/translations";

interface ISignupFormProps extends THandlerComponentProps<
  TFormHandlerStore<TSignupData, IMessageResponse, any>
> { }


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
        if (!item) return buildSentence(t, "select", "business");
        return `${item.name} (${item.tenantId})`;
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

const SignupForm = React.memo(function SignupForm({
  storeKey,
  store,
}: ISignupFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const { user } = useAuthUser();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isSubmitting = store((state) => state.isSubmitting);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const originalFields = store((state) => state.fields);

  // React 19: Memoized fields for better performance
  const fields = useMemo(
    () => ({
      ...originalFields,
      password: {
        ...originalFields.password,
        type: showPassword ? "text" : "password",
        placeholder: t("Enter Password"),
        label: t("Password"),
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
        type: showConfirmPassword ? "text" : "password",
        placeholder: t("Enter Confirm Password"),
        label: t("Confirm Password"),
        endAdornment: (
          <button
            type="button"
            onClick={() =>
              startTransition(() =>
                setShowConfirmPassword(!showConfirmPassword),
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
      email: {
        ...originalFields.email,
        placeholder: t("Enter Email"),
        label: t("Email"),
        startAdornment: <Mail className="h-4 w-4 text-muted-foreground" />,
      },
      firstName: {
        ...originalFields.firstName,
        placeholder: t("Enter First Name"),
        label: t("First Name"),
        startAdornment: <User className="h-4 w-4 text-muted-foreground" />,
      },
      lastName: {
        ...originalFields.lastName,
        placeholder: t("Enter Last Name"),
        label: t("Last Name"),
        startAdornment: <User className="h-4 w-4 text-muted-foreground" />,
      },
      business: {
        ...originalFields.business,
        type: 'custom',
        Component: BusinessSelect,
        placeholder: t("selectBusiness"),
      },
      // trainer: {
      //   ...originalFields.trainer,
      //   renderItem: (item) => {
      //     return (
      //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      //         {item.experience}
      //         {item.specialization}
      //       </div>
      //     );
      //   },
      //   visible: (ctx) => {
      //     const { values } = ctx;
      //     return values.level == SignupUserLevel.STAFF;
      //   }
      // }
    }),
    [originalFields, showPassword, showConfirmPassword],
  );

  const inputs = useInput<TSignupData>({
    fields: fields  as TFieldConfigObject<TSignupData>,
    showRequiredAsterisk: true,
  }) as FormInputs<TSignupData>;

  return (
    <Form<TSignupData, IMessageResponse> formStore={store}>
      <AppCard
        header={
          <>
            <h2 className="text-md font-semibold">{t("signupHeading")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("signupSubheading")}
            </p>
          </>
        }
        footer={
          <div className="flex flex-col gap-4 w-full">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              data-component-id={componentId}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("signup")}
            </Button>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {t("alreadyHaveAccountPrompt")}{" "}
                <Link to={PUBLIC_ROUTES.LOGIN} className="hover:underline">
                  {t("loginLinkLabel")}
                </Link>
              </p>
              <p className="text-xs text-muted-foreground">
                {t("bySigningUp") || "By signing up, you agree to our"}{" "}
                <Link
                  to={PUBLIC_ROUTES.PAGE.replace(
                    ":slug",
                    "terms-and-conditions",
                  )}
                  className="hover:underline text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("termsAndConditions")}
                </Link>{" "}
                {t("and") || "and"}{" "}
                <Link
                  to={PUBLIC_ROUTES.PAGE.replace(":slug", "privacy-policy")}
                  className="hover:underline text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("privacyPolicy")}
                </Link>
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          {/* <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t("joinAsLabel")}
            </h3>
            <div className="space-y-4">
              {inputs.level}
            </div>
          </div> */}

          {/* Account Information Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t("accountInformationLabel")}
            </h3>
            <div className="space-y-4">
              {inputs.email}
              {inputs.password}
              {inputs.confirmPassword}
            </div>
          </div>

          {/* Profile Information Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {t("profileInformationLabel")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.firstName}
              {inputs.lastName}
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.business}
            </div>
          </div>
          {/* <div>
            {inputs.staff as ReactNode}
          </div> */}
        </div>
      </AppCard>
    </Form>
  );
});

export default SignupForm;
