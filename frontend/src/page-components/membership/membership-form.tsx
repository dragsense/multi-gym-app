// External Libraries
import { useShallow } from 'zustand/shallow';
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback, useId, useTransition, useDeferredValue } from "react";

// Handlers
import { FormHandler } from "@/handlers";

// Types
import { EVALIDATION_MODES } from "@/enums/form.enums";
import { type THandlerComponentProps } from "@/@types/handler-types";
import { type IMembership } from "@shared/interfaces/membership.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";
import { EBillingFrequency, EMembershipExpiry, EPaymentPreference } from '@shared/enums/membership.enum';
// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { MembershipFormModal, type IMembershipFormModalExtraProps } from "@/components/admin";

// Services
import { createMembership, updateMembership } from "@/services/membership/membership.api";
import { strictDeepMerge } from "@/utils";
import { CreateMembershipDto, UpdateMembershipDto } from "@shared/dtos";
import type { TMembershipData } from '@shared/types/membership.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TMembershipExtraProps = {};

interface IMembershipFormProps extends THandlerComponentProps<TSingleHandlerStore<IMembership, TMembershipExtraProps>> { }

export default function MembershipForm({
    storeKey,
    store,
}: IMembershipFormProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();

    const queryClient = useQueryClient();
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



    const INITIAL_VALUES: TMembershipData = {
        title: "",
        description: "",
        enabled: true,
        sortOrder: 0,
        color: "",
        price: null,
        pricePeriod: 1,
        signupFee: 0,
        annualFee: 0,
        cancellationFee: 0,
        discountPercentage: 0,
        expiry: EMembershipExpiry.AFTER_3_MONTHS,
        paymentPreference: [EPaymentPreference.CASH], // Default to CASH and ONLINE
        billingFrequency: EBillingFrequency.MONTHLY,
        billingStartDay: new Date().getDate(), // Current day of month (1-31)
        prorate: true, // Enabled by default
        annualFeeDate: undefined,
        settings: undefined,
        accessHours: [],
        accessFeatures: [],
        doors: undefined,
        termsAndConditions: "",
    };

    const initialValues = useMemo(() => {
        return strictDeepMerge<TMembershipData>(INITIAL_VALUES, response ?? {});
    }, [INITIAL_VALUES, response?.id]);

    // React 19: Enhanced handler with transitions
    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction("none");
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;

    const mutationFn = useMemo(() => {
        return isEditing ? updateMembership(response.id) : createMembership;
    }, [isEditing, response?.id]);

    const dto = useMemo(() => {
        return isEditing ? UpdateMembershipDto : CreateMembershipDto;
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
            <FormHandler<TMembershipData, IMessageResponse, IMembershipFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={MembershipFormModal}
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

