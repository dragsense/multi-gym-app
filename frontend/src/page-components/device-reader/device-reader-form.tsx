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
import { type IDeviceReader } from "@shared/interfaces/device-reader.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { DeviceReaderFormModal, type IDeviceReaderFormModalExtraProps } from "@/components/admin";

// Services
import { createDeviceReader, updateDeviceReader } from "@/services/device-reader.api";
import { strictDeepMerge } from "@/utils";
import { CreateDeviceReaderDto, UpdateDeviceReaderDto } from "@shared/dtos";
import type { TCreateDeviceReaderData, TUpdateDeviceReaderData } from '@shared/types/device-reader.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TDeviceReaderExtraProps = {};

interface IDeviceReaderFormProps extends THandlerComponentProps<TSingleHandlerStore<IDeviceReader, TDeviceReaderExtraProps>> {}

export default function DeviceReaderForm({
    storeKey,
    store,
}: IDeviceReaderFormProps) {
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
        const INITIAL_VALUES: TCreateDeviceReaderData = {
            deviceName: "",
            macAddress: "",
            status: undefined,
            location: undefined,
        };
        return strictDeepMerge<TCreateDeviceReaderData>(INITIAL_VALUES, response ?? {});
    }, [response]);

    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;
    const mutationFn = isEditing ? updateDeviceReader(response.id) : createDeviceReader;
    const dto = isEditing ? UpdateDeviceReaderDto : CreateDeviceReaderDto;

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div data-component-id={componentId}>
            <FormHandler<TCreateDeviceReaderData, IMessageResponse, IDeviceReaderFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={DeviceReaderFormModal}
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

