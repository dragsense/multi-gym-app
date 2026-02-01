// src/pages/auth/VerifyOtpPage.tsx
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";

// Types
import type { TVerifyOtpData } from "@shared/types";

import { EVALIDATION_MODES } from "@/enums/form.enums";

// Handlers
import { FormHandler } from "@/handlers";

// Custom UI Components
import { VerifyOtpForm } from "@/components/auth";

// Services
import { resendOtp, verifyOtp } from "@/services/auth.api";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { VerifyOtpDto } from "@shared/dtos";

// Localization
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";


export default function VerifyOtpPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const token = searchParams.get("token");

  const OTP_INITIAL_VALUES: TVerifyOtpData = {
    token: token || "",
    code: "",
    rememberDevice: true,
    deviceId: localStorage.getItem("app_device_id") || undefined,
  };

  return (
    <FormHandler<
      TVerifyOtpData,
      IMessageResponse,
      { resendOtp: () => Promise<IMessageResponse> }
    >
      mutationFn={verifyOtp}
      FormComponent={VerifyOtpForm}
      initialValues={OTP_INITIAL_VALUES}
      validationMode={EVALIDATION_MODES.OnChange}
      dto={VerifyOtpDto}
      onSuccess={() => {
        startTransition(() => {
          toast.success(buildSentence(t, "login", "successful"));
          queryClient.invalidateQueries({ queryKey: ["me"] });
          // Navigate to root - routing system will handle redirect based on user level and onboarding status
          navigate("/");
        });
      }}
      onError={(error) =>
        toast.error(
          buildSentence(t, "otp", "verification", "failed") +
          ": " +
          error?.message
        )
      }
      storeKey="verify-otp"
      formProps={{
        resendOtp: () => resendOtp({ token: token || "" }),
      }}
    />
  );
}
