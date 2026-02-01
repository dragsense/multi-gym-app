// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type TReferralLinkData } from "@shared/types/referral-link.type";
import { type IReferralLink, type IReferralLinkResponse } from "@shared/interfaces/referral-link.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import ReferralLinkFormModal from "@/components/admin/referral-links/form/referral-link-form-modal";

// Services
import { createReferralLink, updateReferralLink } from "@/services/referral-link.api";
import { strictDeepMerge } from "@/utils";
import { CreateReferralLinkDto, UpdateReferralLinkDto } from "@shared/dtos/referral-link-dtos";
import { EReferralLinkType } from "@shared/enums/referral-link.enum";

export type TReferralLinkExtraProps = {
    // Add any extra props if needed
}

interface IReferralLinkFormProps extends THandlerComponentProps<TSingleHandlerStore<IReferralLink, TReferralLinkExtraProps>> {
}

export default function ReferralLinkForm({
    storeKey,
    store,
}: IReferralLinkFormProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const queryClient = useQueryClient();

    if (!store) {
        return <div>Single store "{storeKey}" not found. Did you forget to register it?</div>;
    }

    const { action, response, isLoading, setAction, reset } = store(useShallow(state => ({
        action: state.action,
        response: state.response,
        isLoading: state.isLoading,
        setAction: state.setAction,
        reset: state.reset
    })));

    const INITIAL_VALUES: TReferralLinkData = {
        title: "",
        type: EReferralLinkType.CLIENT,
        description: "",
        commissionPercentage: 10,
        expiresAt: "",
        maxUses: undefined,
    };

    // React 19: Memoized initial values with deferred processing
    const initialValues = useMemo(() => {
        return strictDeepMerge<TReferralLinkData>(INITIAL_VALUES, response ?? {});
    }, [INITIAL_VALUES, response?.id]);

    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;

    const mutationFn = useMemo(() => {
        if (isEditing) {
            return updateReferralLink(response.id);
        }
        return createReferralLink;
    }, [isEditing, response?.id]);

    // React 19: Memoized DTO to prevent unnecessary re-renders
    const dto = useMemo(() => {
        return isEditing ? UpdateReferralLinkDto : CreateReferralLinkDto;
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
            <FormHandler<TReferralLinkData, IReferralLinkResponse, any>
                mutationFn={mutationFn}
                FormComponent={ReferralLinkFormModal}
                storeKey={storeKey}
                initialValues={initialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={() => {
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
                        handleClose();
                    });
                }}
                formProps={{
                    open: action === 'createOrUpdate',
                    onClose: handleClose,
                }}
            />
        </div>
    );
}
