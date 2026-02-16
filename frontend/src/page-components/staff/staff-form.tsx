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
import { type TStaffData } from "@shared/types/staff.type";
import { type IUser } from "@shared/interfaces/user.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { StaffFormModal, type IStaffFormModalExtraProps } from "@/components/admin";
import { CredentialModal } from "@/components/shared-ui/credential-modal";

// Services
import { createStaff, updateStaff } from "@/services/staff.api";
import { strictDeepMerge } from "@/utils";
import { EUserGender, EUserLevels } from "@shared/enums";
import { CreateStaffDto, UpdateStaffDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { IStaff } from "@shared/interfaces/staff.interface";


interface IStaffFormProps extends THandlerComponentProps<TSingleHandlerStore<IStaff, any>> {
}

export default function StaffForm({
    storeKey,
    store,
}: IStaffFormProps) {
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

    const INITIAL_VALUES: TStaffData = {
        isTrainer: false,
        user: {
            email: "",
            isActive: true,
            firstName: "",
            lastName: "",
            dateOfBirth: new Date(
                new Date().setFullYear(new Date().getFullYear() - 12)
            ).toISOString(),
            gender: EUserGender.MALE,
            level: EUserLevels.STAFF,
            isAdministrative: false,
            roles: [],
            permissions: []
        },
        specialization: undefined,
        experience: undefined,
        location: undefined,
    };

    const initialValues = useMemo(() => {

        if (!response) {
            return INITIAL_VALUES;
        }

        const { user, ...rest } = response as Partial<TStaffData>;
        return strictDeepMerge<TStaffData>(INITIAL_VALUES, {
            ...rest,
            user: {
                ...user,
                roles: user?.roles?.map((role) => role.role),
                permissions: user?.permissions?.map((permission) => permission.permission)
            }
        });

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
        return isEditing && response?.id
            ? (data: TStaffData) => updateStaff(response.id, data)
            : createStaff;
    }, [isEditing, response?.id]);

    const dto = useMemo(() => {
        return isEditing ? UpdateStaffDto : CreateStaffDto;
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
            <FormHandler<TStaffData, IStaff, IStaffFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={StaffFormModal}
                storeKey={storeKey}
                initialValues={initialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={(response: any) => {
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
                        queryClient.invalidateQueries({ queryKey: [storeKey] });

                        if (isEditing) {
                            handleClose();
                            return;
                        }

                        if (response && 'user' in response && response.user) {
                            setCredentialModalContent({
                                open: true,
                                email: response.user.email,
                                password: response.user.password || ""
                            });
                        } else {
                            handleClose();
                        }
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
    );
}
