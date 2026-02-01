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
import { type IBannerImage } from "@shared/interfaces/advertisement.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { BannerImageFormModal, type IBannerImageFormModalExtraProps } from "@/components/admin";

// Services
import { createBannerImage, updateBannerImage } from "@/services/banner-image.api";
import { strictDeepMerge } from "@/utils";
import { CreateBannerImageDto, UpdateBannerImageDto } from "@shared/dtos";
import type { TCreateBannerImageData, TUpdateBannerImageData } from '@shared/types/advertisement.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TBannerImageExtraProps = {};

interface IBannerImageFormProps extends THandlerComponentProps<TSingleHandlerStore<IBannerImage, TBannerImageExtraProps>> { }

export default function BannerImageForm({
    storeKey,
    store,
}: IBannerImageFormProps) {
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


    const INITIAL_VALUES: TCreateBannerImageData = {
        name: "",
        image: null as any, // Required field, but null initially for form
    };

    // React 19: Memoized initial values with deferred processing
    const initialValues = useMemo(() => {
        return strictDeepMerge<TCreateBannerImageData>(INITIAL_VALUES, response ?? {});
    }, [response, INITIAL_VALUES]);


    // React 19: Enhanced handler with transitions
    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

   

    const isEditing = !!response?.id;

    const mutationFn = useMemo(() => {
        return isEditing && response?.id ? updateBannerImage(response.id) : createBannerImage;
    }, [isEditing, response?.id]);

    const dto = useMemo(() => {
        return isEditing ? UpdateBannerImageDto : CreateBannerImageDto;
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
            <FormHandler<TCreateBannerImageData | TUpdateBannerImageData, IMessageResponse, IBannerImageFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={BannerImageFormModal}
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

