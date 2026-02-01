// External Libraries
import { toast } from "sonner";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { type TForgotPasswordData } from "@shared/types/auth.type";

// Handlers
import { FormHandler } from "@/handlers";

// Custom UI Components
import { ForgotPasswordForm } from "@/components/auth";

// Services
import { forgotPassword } from "@/services/auth.api";
import { ForgotPasswordDto } from "@shared/dtos";

// Localization
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";


export default function ForgotPasswordPage() {
  const { t } = useI18n();

  const FORGOT_PASSWORD_INITIAL_VALUES: TForgotPasswordData = {
    email: ""
  };

  return (
    <FormHandler<TForgotPasswordData, IMessageResponse>
      mutationFn={forgotPassword}
      FormComponent={ForgotPasswordForm}
      initialValues={FORGOT_PASSWORD_INITIAL_VALUES}
      validationMode={EVALIDATION_MODES.OnChange}
      dto={ForgotPasswordDto}
      onSuccess={() => {
        toast.success(buildSentence(t, 'password', 'reset', 'email', 'sent'));
      }}
      onError={(error) => toast.error(buildSentence(t, 'failed', 'to', 'send', 'reset', 'email') + ': ' + error?.message)}
      storeKey="forgot-password"
    />
  );
}
