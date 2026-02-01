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
import { type IAdvertisement } from "@shared/interfaces/advertisement.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { AdvertisementFormModal, type IAdvertisementFormModalExtraProps } from "@/components/admin";

// Services
import { createAdvertisement, updateAdvertisement } from "@/services/advertisement.api";
import { strictDeepMerge } from "@/utils";
import { CreateAdvertisementDto, UpdateAdvertisementDto } from "@shared/dtos";
import type { TCreateAdvertisementData, TUpdateAdvertisementData } from '@shared/types/advertisement.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { EAdvertisementStatus } from "@shared/enums/advertisement.enum";

export type TAdvertisementExtraProps = {};

interface IAdvertisementFormProps extends THandlerComponentProps<TSingleHandlerStore<IAdvertisement, TAdvertisementExtraProps>> {}

export default function AdvertisementForm({
    storeKey,
    store,
}: IAdvertisementFormProps) {
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
        const INITIAL_VALUES: TCreateAdvertisementData = {
            title: "",
            status: EAdvertisementStatus.DRAFT,
            startDate: "",
            endDate: "",
            websiteLink: "",
            bannerImage: null,
        };
        return strictDeepMerge<TCreateAdvertisementData>(INITIAL_VALUES, response ?? {});
    }, [response]);


    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;
    const mutationFn = isEditing ? updateAdvertisement(response.id) : createAdvertisement;
    const dto = isEditing ? UpdateAdvertisementDto : CreateAdvertisementDto;


    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }


    return (
        <div data-component-id={componentId}>
            <FormHandler<TCreateAdvertisementData, IMessageResponse, IAdvertisementFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={AdvertisementFormModal}
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

