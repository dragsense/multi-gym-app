// External Libraries
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition, useId } from "react";

// Types
import { type TLoginData } from "@shared/types/auth.type";
import { type ILoginResponse } from "@shared/interfaces/auth.interface";
import { EVALIDATION_MODES } from "@/enums/form.enums";

// Handlers
import { FormHandler } from "@/handlers";

// Custom UI Components
import { LoginForm } from "@/components/auth";

// Services
import { login } from "@/services/auth.api";
import { LoginDto } from "@shared/dtos";
import { useNavigate } from "react-router-dom";
import { buildRoutePath } from "@/lib/utils";
import { PUBLIC_ROUTES } from "@/config/routes.config";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

function getOrCreateDeviceId(): string {
  const key = "app_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

export default function LoginPage() {
  // React 19: Essential IDs and transitions
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const LOGIN_INITIAL_VALUES: TLoginData = {
    email: "",
    password: "",
    deviceId: getOrCreateDeviceId(),
  };

  return (
    <>
      <FormHandler<TLoginData, ILoginResponse>
        mutationFn={login}
        FormComponent={LoginForm}
        initialValues={LOGIN_INITIAL_VALUES}
        validationMode={EVALIDATION_MODES.OnChange}
        dto={LoginDto}
        onSuccess={(res: unknown) => {
          startTransition(() => {
            const result: ILoginResponse = res as ILoginResponse;
            if (result.requiredOtp)
              navigate(
                buildRoutePath(PUBLIC_ROUTES.VERIFY_OTP, undefined, {
                  token: result.accessToken?.token || "",
                })
              );
            else {
              toast.success(buildSentence(t, "login", "successful"));
              queryClient.invalidateQueries({ queryKey: ["me"] });
              // Navigate to root - LevelBasedRedirect will handle routing based on user level
              navigate("/");
            }
          });
        }}
        onError={(error) =>
          toast.error(
            buildSentence(t, "login", "failed") + ": " + error?.message
          )
        }
        storeKey="login"
      />
    </>
  );
}
