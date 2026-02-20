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
import { type ILocation } from "@shared/interfaces/location.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { LocationFormModal, type ILocationFormModalExtraProps } from "@/components/admin";
import { LOCATION_SELECTION_STORE_KEY } from "@/page-components/location/location-selection";

// Services
import { createLocation, updateLocation } from "@/services/location.api";
import { strictDeepMerge } from "@/utils";
import { CreateLocationDto, UpdateLocationDto } from "@shared/dtos";
import type { TCreateLocationData, TUpdateLocationData } from '@shared/types/location.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TLocationExtraProps = {};

interface ILocationFormProps extends THandlerComponentProps<TSingleHandlerStore<ILocation, TLocationExtraProps>> { }

export default function LocationForm({
    storeKey,
    store,
}: ILocationFormProps) {
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

    const initialValues = useMemo(() => {
        const INITIAL_VALUES: TCreateLocationData = {
            name: "",
            address: "",
        };
        return strictDeepMerge<TCreateLocationData>(INITIAL_VALUES, response ?? {});
    }, [response]);

    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;
    const mutationFn = isEditing ? updateLocation(response.id) : createLocation;
    const dto = isEditing ? UpdateLocationDto : CreateLocationDto;

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div data-component-id={componentId}>
            <FormHandler<TCreateLocationData, IMessageResponse, ILocationFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={LocationFormModal}
                storeKey={storeKey}
                initialValues={initialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={() => {
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
                        queryClient.invalidateQueries({ queryKey: [LOCATION_SELECTION_STORE_KEY + "-list"] });
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

