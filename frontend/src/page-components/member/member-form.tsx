// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useCallback, useId, useTransition, useDeferredValue } from "react";
import { toast } from "sonner";
// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TMemberData } from "@shared/types/member.type";
import { type IMember, type TMemberResponse } from "@shared/interfaces/member.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { MemberFormModal, type IMemberFormModalExtraProps } from "@/components/admin";
import { CredentialModal } from "@/components/shared-ui/credential-modal";

// Services
import { createMember, updateMember } from "@/services/member.api";
import { strictDeepMerge } from "@/utils";
import { EUserGender, EUserLevels } from "@shared/enums";
import { CreateMemberDto, UpdateMemberDto } from "@shared/dtos";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TMemberExtraProps = {
    level: number;
}

interface IMemberFormProps extends THandlerComponentProps<TSingleHandlerStore<IMember, TMemberExtraProps>> {
}

export function MemberForm({
    storeKey,
    store,
}: IMemberFormProps) {
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

    const INITIAL_VALUES: TMemberData = {
        user: {
            email: "",
            isActive: true,
            firstName: "",
            lastName: "",
            gender: EUserGender.MALE,
            dateOfBirth: new Date(
                new Date().setFullYear(new Date().getFullYear() - 12)
            ).toISOString(),
            level: EUserLevels.MEMBER,
        },
        fitnessLevel: '',
        goal: '',
        medicalConditions: '',
    };

    // React 19: Memoized initial values with deferred processing
    const initialValues = useMemo(() => {
        return strictDeepMerge<TMemberData>(INITIAL_VALUES, response ?? {});
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
        return isEditing ? updateMember(response.id) : createMember;
    }, [isEditing, response?.id]);

    // React 19: Memoized DTO to prevent unnecessary re-renders
    const dto = useMemo(() => {
        return isEditing ? UpdateMemberDto : CreateMemberDto;
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
            {!credentialModalContent?.open && <FormHandler<TMemberData, TMemberResponse, IMemberFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={MemberFormModal}
                storeKey={storeKey}
                initialValues={initialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={(response: any) => {
                toast.success(isEditing? buildSentence(t,"profile", "updated successfully"): buildSentence(t,"profile","created successfully"));
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
                        //hanlde close modal after confrim editing
                            if (isEditing) {
                               handleClose();
                               return;
                             }
                        if (response && 'member' in response && response.member && 'user' in response.member) {
                            const user = response.member.user;
                            setCredentialModalContent({
                                open: true,
                                email: user.email,
                                password: user.password || ""
                            })
                        } else {
                            queryClient.invalidateQueries({ queryKey: ['member-detail-' + response?.id] });
                            handleClose();
                        }
                    });
                }}
                formProps={{
                    open: action === 'createOrUpdate',
                    onClose: handleClose,
                }}
            />}

            <CredentialModal
                open={credentialModalContent.open}
                onOpenChange={(state: boolean) => {
                    startTransition(() => {
                        if (!state) {
                            handleClose();
                        }
                    });
                }}
                email={credentialModalContent.email}
                password={credentialModalContent.password}
                closeModal={handleClose}
            />
        </div>
    );
}
