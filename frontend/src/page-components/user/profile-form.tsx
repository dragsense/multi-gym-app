
// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type TListHandlerComponentProps } from "@/@types/handler-types";
import { type TUpdateProfileData } from "@shared/types/user.type";
import type { IUser, IMember, ITrainer, IProfile } from "@shared/interfaces";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";


// Store
import { type TListHandlerStore } from "@/stores";

// Components
import { ProfileFormModal, type IProfileFormModalExtraProps } from "@/components/admin";

// Services
import { fetchUserProfile, updateProfile } from "@/services/user.api";
import { strictDeepMerge } from "@/utils";
import { UpdateProfileDto } from "@shared/dtos";

// Hooks
import { useApiQuery } from "@/hooks/use-api-query";




interface IProfileFormProps extends TListHandlerComponentProps<TListHandlerStore<IUser | IMember | ITrainer, any, any>> {
}

export default function ProfileForm({
    storeKey,
    store,
}: IProfileFormProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const queryClient = useQueryClient();


    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }



    const { action, payload, setAction } = store(useShallow(state => ({
        action: state.action,
        payload: state.payload,
        setAction: state.setAction,
    })));

    // Check if action is 'updateProfile' and id exists in payload
    const isUpdateProfileAction = action === 'updateProfile';
    const userId = payload;

    const { data, isLoading } = useApiQuery<IProfile>(
        [storeKey + "-profile", userId],
        () => fetchUserProfile(userId),
        {},
        {
            enabled: isUpdateProfileAction && !!userId,
        }
    );


    const profile = data

    const INITIAL_VALUES: TUpdateProfileData = {
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
        documents: []
    };

    const initialValues = useMemo(() => {
        return strictDeepMerge<TUpdateProfileData>(INITIAL_VALUES, profile ?? {});
    }, [INITIAL_VALUES, profile?.id]);





    const handleClose = useCallback(() => {
        startTransition(() => {
            setAction('none');
        });
    }, [setAction, startTransition]);



    const isEditing = true;
    const mutationFn = profile?.id ? updateProfile(profile.id) : new Promise((resolve) => resolve({ message: "Profile not found" } as IMessageResponse));
    const dto = UpdateProfileDto;



    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!profile) {
        return <div>No Profile found</div>;
    }


    return (
        <div data-component-id={componentId}>
            <FormHandler<TUpdateProfileData, IMessageResponse, IProfileFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={ProfileFormModal}
                storeKey={storeKey}
                initialValues={initialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={() => {
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-profile"] });
                        handleClose();
                    });
                }}
                formProps={{
                    open: action === 'updateProfile',
                    onClose: handleClose,
                }}
            />
        </div>
    )

}

