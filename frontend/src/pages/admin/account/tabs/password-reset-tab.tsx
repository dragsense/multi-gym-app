// External Libraries
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import { toast } from "sonner";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type TUserResetPasswordData } from "@shared/types/user.type";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Components
import { PasswordResetForm } from "@/components/admin";

// Services
import { changePassword } from "@/services/user.api";
import { ResetPasswordDto } from "@shared/dtos";

const INITIAL_VALUES: TUserResetPasswordData = {
    currentPassword: "",
    password: "",
    confirmPassword: "",
};

export default function PasswordResetTab() {
    const [, startTransition] = useTransition();
    const queryClient = useQueryClient();
    const PASSWORD_RESET_STORE_KEY = "account-password-reset";

    const handleSuccess = () => {
        startTransition(() => {
            toast.success("Password updated successfully");
            queryClient.invalidateQueries({ queryKey: ["me"] });
        });
    };

    const handleError = (error: any) => {
        toast.error(error?.message || "Failed to update password");
    };

    return (
        <FormHandler<TUserResetPasswordData, IMessageResponse>
            mutationFn={changePassword}
            FormComponent={PasswordResetForm}
            storeKey={PASSWORD_RESET_STORE_KEY}
            initialValues={INITIAL_VALUES}
            dto={ResetPasswordDto}
            validationMode={EVALIDATION_MODES.OnSubmit}
            isEditing={false}
            onSuccess={handleSuccess}
            onError={handleError}
        />
    );
}

