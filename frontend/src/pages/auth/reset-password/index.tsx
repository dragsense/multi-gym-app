// External Libraries
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTransition, useId } from "react";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { type TAuthResetPasswordData } from "@shared/types/auth.type";

// Handlers
import { FormHandler } from "@/handlers";

// Custom UI Components
import { ResetPasswordForm } from "@/components/auth";

// Services
import { resetPassword } from "@/services/auth.api";
import { ResetPasswordWithTokenDto } from "@shared/dtos";

// Config
import { PUBLIC_ROUTES } from "@/config/routes.config";

// Localization
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";



export default function ResetPasswordPage() {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const RESET_PASSWORD_INITIAL_VALUES: TAuthResetPasswordData = {
    token: token ?? "",
    password: "",
    confirmPassword: ""
  };
  
  if (!token) {
    navigate(PUBLIC_ROUTES.LOGIN);
    return null;
  }

  return (
    <FormHandler<TAuthResetPasswordData, IMessageResponse>
      mutationFn={resetPassword}
      FormComponent={ResetPasswordForm}
      initialValues={RESET_PASSWORD_INITIAL_VALUES}
      validationMode={EVALIDATION_MODES.OnChange}
      dto={ResetPasswordWithTokenDto}
      onSuccess={() => {
        startTransition(() => {
          toast.success(buildSentence(t, 'password', 'reset', 'successfully'));
          navigate(PUBLIC_ROUTES.LOGIN);
        });
      }}
      onError={(error) => toast.error(buildSentence(t, 'failed', 'to', 'reset', 'password') + ': ' + error?.message)}
      storeKey="reset-password"
    />
  );
}
