// React
import { useTransition, useMemo } from "react";
import { toast } from "sonner";

// Types
import { CreateBusinessDto, UpdateBusinessDto } from "@shared/dtos";
import { type IBusiness } from "@shared/interfaces";

// Components
import { BusinessSetupForm } from "@/components/business-onboarding";

// Handlers
import { FormHandler } from "@/handlers";
import { EVALIDATION_MODES } from "@/enums/form.enums";

// Services
import { createBusiness, updateBusiness } from "@/services/business/business.api";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { useQueryClient } from "@tanstack/react-query";
import { strictDeepMerge } from "@/utils";

interface IBusinessSetupStepProps {
  onComplete: (data: { name: string; subdomain: string; businessId: string }) => void;
  onBack?: () => void;
  businessData?: { businessId: string } | null;
  existingBusiness?: IBusiness | null;
}

export function BusinessSetupStep({ onComplete, onBack, businessData, existingBusiness }: IBusinessSetupStepProps) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const INITIAL_VALUES: CreateBusinessDto = {
    name: "",
    subdomain: "",
  };

  const businessInitialValues = useMemo(() => {
    if (existingBusiness) {
      return strictDeepMerge<CreateBusinessDto>(INITIAL_VALUES, {
        name: existingBusiness.name || "",
        subdomain: existingBusiness.subdomain || "",
      });
    }
    return INITIAL_VALUES;
  }, [existingBusiness]);

  const isEditing = !!existingBusiness && !!existingBusiness.id;

  const mutationFn = isEditing && existingBusiness
    ? (data: CreateBusinessDto) => updateBusiness(existingBusiness.id)(data)
    : createBusiness;

  return (
    <FormHandler<CreateBusinessDto, IBusiness>
      mutationFn={mutationFn}
      FormComponent={BusinessSetupForm}
      storeKey="business-onboarding-setup"
      initialValues={businessInitialValues}
      validationMode={EVALIDATION_MODES.OnChange}
      dto={isEditing ? UpdateBusinessDto : CreateBusinessDto}
      isEditing={isEditing}
      onSuccess={(res) => {

        const business = res as IBusiness;

        if (!business || !business.id) {
          toast.error("Failed to save business: Invalid response");
          return;
        }

        const message = isEditing 
          ? "Business updated successfully" 
          : "Business setup completed successfully";
        toast.success(message);
        
        queryClient.invalidateQueries({ queryKey: ["business-onboarding-setup", businessData?.businessId] });
        queryClient.invalidateQueries({ queryKey: ["my-business"] });
        
        startTransition(() => {
          onComplete({
            name: business.name || businessInitialValues.name,
            subdomain: business.subdomain || businessInitialValues.subdomain,
            businessId: business.id,
          });
        });
      }}
      onError={(error) => {
        toast.error(`Failed to ${isEditing ? 'update' : 'setup'} business: ` + error?.message);
      }}
      formProps={{
        onBack: onBack,
      }}
    />
  );
}
