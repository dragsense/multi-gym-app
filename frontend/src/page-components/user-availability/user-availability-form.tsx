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
import { type IUserAvailability } from "@shared/interfaces/user-availability.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components

// Services
import { createUserAvailability } from "@/services/user-availability.api";
import { strictDeepMerge } from "@/utils";
import { CreateUserAvailabilityDto } from "@shared/dtos/user-availability-dtos";
import type { TUserAvailabilityData } from '@shared/types';
import { UserAvailabilityFormModal, type IUserAvailabilityFormModalExtraProps } from '@/components/admin';
import type { IMessageResponse } from '@shared/interfaces';



interface IUserAvailabilityFormProps extends THandlerComponentProps<TSingleHandlerStore<IUserAvailability, TUserAvailabilityExtraProps>> {
}

export default function UserAvailabilityForm({
    storeKey,
    store,
}: IUserAvailabilityFormProps) {
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

    const INITIAL_VALUES = {
        weeklySchedule: {
            monday: { enabled: true, timeSlots: [] },
            tuesday: { enabled: true, timeSlots: [] },
            wednesday: { enabled: true, timeSlots: [] },
            thursday: { enabled: true, timeSlots: [] },
            friday: { enabled: true, timeSlots: [] },
            saturday: { enabled: false, timeSlots: [] },
            sunday: { enabled: false, timeSlots: [] },
        },
        unavailablePeriods: [],
    };

    // React 19: Memoized initial values with deferred processing
    const initialValues = strictDeepMerge<TUserAvailabilityData>(INITIAL_VALUES, response ?? {});

    const handleClose = useCallback(() => {
        startTransition(() => {
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = false;

    // React 19: Memoized DTO to prevent unnecessary re-renders
    const dto = CreateUserAvailabilityDto;

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div data-component-id={componentId}>
            <FormHandler<TUserAvailabilityData, IMessageResponse, IUserAvailabilityFormModalExtraProps>
                mutationFn={createUserAvailability}
                FormComponent={UserAvailabilityFormModal}
                storeKey={storeKey}
                initialValues={initialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={() => {
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-single"] });
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