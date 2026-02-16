// External Libraries
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTransition } from "react";

// Types
import { type TSignupData } from "@shared/types/auth.type";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { EVALIDATION_MODES } from "@/enums/form.enums";

// Handlers
import { FormHandler } from "@/handlers";

// Custom UI Components
import { SignupForm } from "@/components/auth";

// Services
import { signup } from "@/services/auth.api";
import { SignupDto } from "@shared/dtos";

// Config
import { PUBLIC_ROUTES } from "@/config/routes.config";

// Localization
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { buildRoutePath } from "@/lib/utils";
import type { ISignupResponse } from "@shared/interfaces";

export default function SignupPage() {
  // React 19: Essential IDs and transitions
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract referral code from URL
  const referralCodeFromUrl = searchParams.get('ref') || "";

  const SIGNUP_INITIAL_VALUES: TSignupData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: referralCodeFromUrl,
  };

  return (
    <FormHandler<TSignupData, IMessageResponse>
      mutationFn={signup}
      FormComponent={SignupForm}
      initialValues={SIGNUP_INITIAL_VALUES}
      validationMode={EVALIDATION_MODES.OnChange}
      dto={SignupDto}
      onSuccess={(res: ISignupResponse) => {
        toast.success(res.message || 'Registration successful');
        startTransition(() => {
          const result: ISignupResponse = res as ISignupResponse;
          if (result.requiredOtp) {
            localStorage.setItem('member_onboarding_step', '1');
            localStorage.setItem('business_onboarding_step', '1');
            navigate(buildRoutePath(PUBLIC_ROUTES.VERIFY_OTP, undefined, { token: result.token || '' }));
          }
        });
      }}
      onError={(error) => toast.error(buildSentence(t, 'signup', 'failed') + ': ' + error?.message)}
      storeKey="signup"
    />
  );
}
