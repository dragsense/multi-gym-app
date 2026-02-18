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
  onComplete: (data: {
    name: string;
    subdomain: string;
    businessId: string;
    paymentProcessorId?: string | null;
    paymentProcessorType?: string | null;
  }) => void;
  onBack?: () => void;
  businessData?: { businessId: string; paymentProcessorId?: string | null } | null;
  existingBusiness?: IBusiness | null;
}

export function BusinessSetupStep({
  onComplete,
  onBack,
  businessData,
  existingBusiness,
}: IBusinessSetupStepProps) {
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const INITIAL_VALUES: CreateBusinessDto = {
    name: "",
    subdomain: "",
/*     paymentProcessorId: undefined,
 */  };

  const businessInitialValues = useMemo(() => {
    if (existingBusiness) {
      return strictDeepMerge<CreateBusinessDto>(INITIAL_VALUES, {
        name: existingBusiness.name || "",
        subdomain: existingBusiness.subdomain || "",
/*         paymentProcessorId: existingBusiness.paymentProcessorId ?? undefined,
 */      });
    }
    return INITIAL_VALUES;
  }, [existingBusiness]);

  const isEditing = !!existingBusiness?.id;

  const mutationFn =
    isEditing && existingBusiness
      ? (data: CreateBusinessDto) => updateBusiness(existingBusiness.id)(data)
      : createBusiness;

  const handleSuccess = (res: IBusiness) => {
    if (!res?.id) {
      toast.error("Failed to save business: Invalid response");
      return;
    }

    toast.success(
      isEditing ? "Business updated successfully" : "Business setup completed successfully"
    );

    queryClient.invalidateQueries({ queryKey: ["business-onboarding-setup", businessData?.businessId] });
    queryClient.invalidateQueries({ queryKey: ["my-business"] });

    startTransition(() => {
      onComplete({
        name: res.name ?? "",
        subdomain: res.subdomain ?? "",
        businessId: res.id,
        paymentProcessorId: res.paymentProcessorId ?? undefined,
        paymentProcessorType: undefined,
      });
    });
  };

  return (
    <FormHandler<CreateBusinessDto, IBusiness>
      mutationFn={mutationFn}
      FormComponent={BusinessSetupForm}
      storeKey="business-onboarding-setup"
      initialValues={businessInitialValues}
      validationMode={EVALIDATION_MODES.OnChange}
      dto={isEditing ? UpdateBusinessDto : CreateBusinessDto}
      isEditing={isEditing}
      onSuccess={(res) => handleSuccess(res as IBusiness)}
      onError={(error) => {
        toast.error(`Failed to ${isEditing ? "update" : "setup"} business: ` + error?.message);
      }}
      formProps={{ onBack }}
    />
  );
}
