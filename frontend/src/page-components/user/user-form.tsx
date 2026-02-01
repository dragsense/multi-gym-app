
// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TUserData } from "@shared/types/user.type";
import { type IUser, type TUserResponse } from "@shared/interfaces/user.interface";


// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { UserFormModal, type IUserFormModalExtraProps } from "@/components/admin";
import { CredentialModal } from "@/components/shared-ui/credential-modal";

// Services
import { createUser, updateUser } from "@/services/user.api";
import { strictDeepMerge } from "@/utils";
import { EUserGender, EUserLevels } from "@shared/enums";
import { CreateUserDto, UpdateUserDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";


export type TUserExtraProps = {
    level: number;
}

interface IUserFormProps extends THandlerComponentProps<TSingleHandlerStore<IUser, TUserExtraProps>> {
}

export default function UserForm({
    storeKey,
    store,
}: IUserFormProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const queryClient = useQueryClient();
    const [credentialModalContent, setCredentialModalContent] = useState({
        open: false,
        email: "",
        password: ""
    });

    const { t } = useI18n();
    
    if (!store) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const { action, response, isLoading, setAction, reset } = store(useShallow(state => ({
        action: state.action,
        response: state.response,
        isLoading: state.isLoading,
        setAction: state.setAction,
        reset: state.reset
    })));


    const INITIAL_VALUES: TUserData = {
        email: "",
        isActive: true,
        firstName: "",
        lastName: "",
        dateOfBirth: new Date(
            new Date().setFullYear(new Date().getFullYear() - 12)
        ).toISOString(),
        gender: EUserGender.MALE,
    };

    // React 19: Memoized initial values with deferred processing
    const initialValues = useMemo(() => {
        return strictDeepMerge<TUserData>(INITIAL_VALUES, response ?? {});
    }, [INITIAL_VALUES, response?.id]);


    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
            setCredentialModalContent({ open: false, email: "", password: "" });
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;

    const mutationFn = useMemo(() => {
        return isEditing ? updateUser(response.id) : createUser;
    }, [isEditing, response?.id]);

    // React 19: Memoized DTO to prevent unnecessary re-renders
    const dto = useMemo(() => {
        return isEditing ? UpdateUserDto : CreateUserDto;
    }, [isEditing]);

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }


    return (
        <div data-component-id={componentId}>
            <FormHandler<TUserData, TUserResponse, IUserFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={UserFormModal}
                storeKey={storeKey}
                initialValues={initialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={(response: any) => {
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });

                        if (response && 'user' in response && response.user) {
                            setCredentialModalContent({
                                open: true,
                                email: response.user.email,
                                password: response.user.password || ""
                            })
                        }
                    });
                }}
                formProps={{
                    open: action === 'createOrUpdate',
                    onClose: handleClose,
                }}
            />

            <CredentialModal
                open={credentialModalContent.open}
                onOpenChange={(state: boolean) => {
                    startTransition(() => {
                        if (!state) {
                            handleClose();
                        }
                    });
                }}
                closeModal={() => {
                    startTransition(() => {
                        handleClose();
                    });
                }}
                email={credentialModalContent.email}
                password={credentialModalContent.password}
            />
        </div>
    )

}
