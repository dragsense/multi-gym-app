// External Libraries
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type TUpdateProfileData } from "@shared/types/user.type";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { IProfile } from "@shared/interfaces/user.interface";

// Components
import { ProfileForm } from "@/components/admin";

// Services
import { fetchMyProfile, updateMyProfile } from "@/services/user.api";
import { strictDeepMerge } from "@/utils";
import { UpdateProfileDto } from "@shared/dtos";

// Hooks
import { useApiQuery } from "@/hooks/use-api-query";

export default function ProfileTab() {
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const PROFILE_STORE_KEY = "account-profile";

  // Fetch profile data
  const { data: profile } = useApiQuery<IProfile>(
    [PROFILE_STORE_KEY],
    fetchMyProfile,
    {},
    {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  const profileInitialValues = useMemo(() => {
    const INITIAL_PROFILE_VALUES: TUpdateProfileData = {
      phoneNumber: "",
      address: "",
      rfid: "",
      emergencyContactName: "",
      emergencyContactNumber: "",
      emergencyContactRelationship: "",
      alternativeEmergencyContactNumber: "",
      state: "",
      city: "",
      zipCode: "",
      country: "",
      image: undefined,
      documents: [],
      removedDocumentIds: [],
    };
    return strictDeepMerge<TUpdateProfileData>(
      INITIAL_PROFILE_VALUES,
      profile ?? {}
    );
  }, [profile]);

  const handleProfileSuccess = () => {
    startTransition(() => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_STORE_KEY] });
    });
  };

  return (
    <FormHandler<TUpdateProfileData, IMessageResponse>
      mutationFn={updateMyProfile()}
      FormComponent={ProfileForm}
      storeKey={PROFILE_STORE_KEY}
      initialValues={profileInitialValues}
      dto={UpdateProfileDto}
      validationMode={EVALIDATION_MODES.OnSubmit}
      isEditing={true}
      onSuccess={handleProfileSuccess}
    />
  );
}
