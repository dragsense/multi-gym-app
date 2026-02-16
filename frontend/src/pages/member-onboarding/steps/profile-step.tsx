// React
import { useTransition, useMemo, useEffect } from "react";
import { toast } from "sonner";

// Types
import { type TUpdateProfileData } from "@shared/types/user.type";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Components
import { ProfileForm } from "@/components/member-onboarding/profile-form";

// Handlers
import { FormHandler } from "@/handlers";
import { EVALIDATION_MODES } from "@/enums/form.enums";

// Services
import { updateMyProfile } from "@/services/user.api";
import { UpdateProfileDto } from "@shared/dtos";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useApiQuery } from "@/hooks/use-api-query";
import { fetchMyProfile } from "@/services/user.api";
import type { IProfile } from "@shared/interfaces/user.interface";
import { strictDeepMerge } from "@/utils";
import { AppLoader } from "@/components/layout-ui/app-loader";
import { useQueryClient } from "@tanstack/react-query";

interface IProfileStepProps {
  onComplete: () => void;
  onBack?: () => void;
}

export function ProfileStep({ onComplete, onBack }: IProfileStepProps) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const { user } = useAuthUser();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: isLoadingProfile } = useApiQuery<IProfile>(
    ["member-onboarding-profile", user?.id],
    fetchMyProfile,
    {}
  );


  const INITIAL_VALUES: TUpdateProfileData = {
    phoneNumber: "",
    address: "",
    state: "",
    city: "",
    zipCode: "",
    country: "",
  };

  const profileInitialValues = useMemo(() => {
    return strictDeepMerge<TUpdateProfileData>(INITIAL_VALUES, profile ?? {});
  }, [profile]);

  if (isLoadingProfile) {
    return <AppLoader>Loading profile...</AppLoader>;
  }

  return (
    <FormHandler<TUpdateProfileData, any>
      mutationFn={updateMyProfile()}
      FormComponent={ProfileForm}
      storeKey="member-onboarding-profile"
      initialValues={profileInitialValues}
      validationMode={EVALIDATION_MODES.OnChange}
      dto={UpdateProfileDto}
      isEditing={true}
      onSuccess={(res) => {
        const message = res && typeof res === 'object' && 'message' in res
          ? (res as IMessageResponse).message
          : "Profile updated successfully";
        toast.success(message);
        queryClient.invalidateQueries({ queryKey: ["member-onboarding-profile", user?.id] });
        startTransition(() => {
          onComplete();
        });
      }}
      onError={(error) => {
        toast.error("Failed to update profile: " + error?.message);
      }}
      formProps={{
        onBack: onBack,
      }}
    />
  );
}

