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
import { type ITrainerService } from "@shared/interfaces/trainer-service.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { TrainerServiceFormModal, type ITrainerServiceFormModalExtraProps } from "@/components/admin";

// Services
import { createTrainerService, updateTrainerService } from "@/services/trainer-service.api";
import { strictDeepMerge } from "@/utils";
import { CreateTrainerServiceDto, UpdateTrainerServiceDto } from "@shared/dtos";
import type { TCreateTrainerServiceData, TUpdateTrainerServiceData } from '@shared/types/trainer-service.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";

export type TTrainerServiceExtraProps = {};

interface ITrainerServiceFormProps extends THandlerComponentProps<TSingleHandlerStore<ITrainerService, TTrainerServiceExtraProps>> {}

export default function TrainerServiceForm({
    storeKey,
    store,
}: ITrainerServiceFormProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { user } = useAuthUser();

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
        const INITIAL_VALUES: TCreateTrainerServiceData = {
            title: "",
            description: "",
            status: undefined,
        };
        return strictDeepMerge<TCreateTrainerServiceData>(INITIAL_VALUES, response ?? {});
    }, [response, user]);

    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;
    const mutationFn = isEditing ? updateTrainerService(response.id) : createTrainerService;
    const dto = isEditing ? UpdateTrainerServiceDto : CreateTrainerServiceDto;

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div data-component-id={componentId}>
            <FormHandler<TCreateTrainerServiceData, IMessageResponse, ITrainerServiceFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={TrainerServiceFormModal}
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

