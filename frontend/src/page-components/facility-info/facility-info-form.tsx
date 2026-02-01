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
import { type IFacilityInfo } from "@shared/interfaces/facility-info.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { FacilityInfoFormModal, type IFacilityInfoFormModalExtraProps } from "@/components/admin";

// Services
import { createFacilityInfo, updateFacilityInfo } from "@/services/facility-info.api";
import { strictDeepMerge } from "@/utils";
import { CreateFacilityInfoDto, UpdateFacilityInfoDto } from "@shared/dtos";
import type { TCreateFacilityInfoData, TUpdateFacilityInfoData } from '@shared/types/facility-info.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TFacilityInfoExtraProps = {};

interface IFacilityInfoFormProps extends THandlerComponentProps<TSingleHandlerStore<IFacilityInfo, TFacilityInfoExtraProps>> {}

export default function FacilityInfoForm({
    storeKey,
    store,
}: IFacilityInfoFormProps) {
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
        const INITIAL_VALUES: TCreateFacilityInfoData = {
            email: "",
            phone: "",
            address: "",
            status: undefined,
        };
        return strictDeepMerge<TCreateFacilityInfoData>(INITIAL_VALUES, response ?? {});
    }, [response]);

    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;
    const mutationFn = isEditing ? updateFacilityInfo(response.id) : createFacilityInfo;
    const dto = isEditing ? UpdateFacilityInfoDto : CreateFacilityInfoDto;

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div data-component-id={componentId}>
            <FormHandler<TCreateFacilityInfoData, IMessageResponse, IFacilityInfoFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={FacilityInfoFormModal}
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

