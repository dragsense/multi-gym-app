// External Libraries
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TBusinessData, type TCreateBusinessWithUserData } from "@shared/types";
import {
  type IMessageResponse,
  type IBusiness,
} from "@shared/interfaces";
import { EUserGender, EUserLevels } from "@shared/enums";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import {
  BusinessFormModal,
  type IBusinessFormModalExtraProps,
} from "@/components/admin/business/form/business-form-modal";
import { CredentialModal } from "@/components/shared-ui/credential-modal";

// Services
import {
  createBusiness,
  createBusinessWithUser,
  updateBusinessWithUser,
} from "@/services/business/business.api";
import { strictDeepMerge } from "@/utils";

// Hooks & Utils
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { CreateBusinessDto, CreateBusinessWithUserDto, UpdateBusinessWithUserDto } from "@shared/dtos";
import { toast } from "sonner";

export type TBusinessExtraProps = {
  level?: number;
};

interface IBusinessFormProps
  extends THandlerComponentProps<
    TSingleHandlerStore<IBusiness, TBusinessExtraProps>
  > { }

export function BusinessForm({ storeKey, store }: IBusinessFormProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [credentialModalContent, setCredentialModalContent] = useState({
    open: false,
    email: "",
    password: ""
  });

  if (!store) {
    return (
      <div>
        {buildSentence(t, "single", "store")} "{storeKey}"{" "}
        {buildSentence(t, "not", "found")}.{" "}
        {buildSentence(t, "did", "you", "forget", "to", "register", "it")}?
      </div>
    );
  }

  const { action, response, isLoading, setAction, reset } = store(
    useShallow((state) => ({
      action: state.action,
      response: state.response,
      isLoading: state.isLoading,
      setAction: state.setAction,
      reset: state.reset,
    }))
  );

  // Check if form should include user fields (if response has user or we're creating with user)
  const hasUserFields = !!(response?.user || (action === "createOrUpdate" && !response?.id));

  const INITIAL_VALUES: TBusinessData | TCreateBusinessWithUserData = hasUserFields ? {
    name: "",
    subdomain: "",
    user: {
      email: "",
      isActive: true,
      firstName: "",
      lastName: "",
      gender: EUserGender.MALE,
      dateOfBirth: new Date(
        new Date().setFullYear(new Date().getFullYear() - 18)
      ).toISOString(),
      level: EUserLevels.SUPER_ADMIN,
    },
  } : {
    name: "",
    subdomain: "",
  };

  const initialValues = useMemo(
    () => strictDeepMerge<TBusinessData | TCreateBusinessWithUserData>(INITIAL_VALUES, response ?? {}),
    [INITIAL_VALUES, response?.id, hasUserFields]
  );

  const handleClose = useCallback(() => {
    startTransition(() => {
      reset();
      setAction("none");
      setCredentialModalContent({ open: false, email: "", password: "" });
    });
  }, [reset, setAction, startTransition]);

  const isEditing = !!response?.id;

  const mutationFn = useMemo(() => {
    if (isEditing) {
      return updateBusinessWithUser(response.id);
    } else {
      return hasUserFields
        ? createBusinessWithUser
        : createBusiness;
    }
  }, [isEditing, response?.id, hasUserFields]);

  const dto = useMemo(() => {
    if (isEditing) {
      return UpdateBusinessWithUserDto;
    } else {
      return hasUserFields ? CreateBusinessWithUserDto : CreateBusinessDto;
    }
  }, [isEditing, hasUserFields]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div data-component-id={componentId}>
      <FormHandler<
         TCreateBusinessWithUserData,
        IMessageResponse | (IMessageResponse & { business: IBusiness }),
        IBusinessFormModalExtraProps
      >
        mutationFn={mutationFn}
        FormComponent={BusinessFormModal}
        storeKey={storeKey}
        initialValues={initialValues}
        dto={dto}
        validationMode={EVALIDATION_MODES.OnSubmit}
        isEditing={isEditing}
        onSuccess={(response: any) => {
          startTransition(() => {
            queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });

            if (response && 'business' in response && response.business && 'user' in response.business) {
              const user = response.business.user;
            
              if (user && user.password) {
                setCredentialModalContent({
                  open: true,
                  email: user.email,
                  password: user.password || ""
                });
                // Don't close form or show toast yet - wait for credential modal to close
                return;
              }
            }
            
            // Only show toast and close if no credential modal
            toast.success(response.message || (isEditing ? "Business updated successfully!" : "Business created successfully!"));
            handleClose();
          });
        }}
        formProps={{
          open: action === "createOrUpdate",
          onClose: handleClose,
        }}
      />

      <CredentialModal
        open={credentialModalContent.open}
        onOpenChange={(state: boolean) => {
          startTransition(() => {
            if (!state) {
              toast.success("Business created successfully!");
              handleClose();
            }
          });
        }}
        email={credentialModalContent.email}
        password={credentialModalContent.password}
        closeModal={() => {
          startTransition(() => {
            toast.success("Business created successfully!");
            handleClose();
          });
        }}
      />
    </div>
  );
}
