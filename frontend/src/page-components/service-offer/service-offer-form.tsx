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
import { type IServiceOffer } from "@shared/interfaces/service-offer.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { ServiceOfferFormModal, type IServiceOfferFormModalExtraProps } from "@/components/admin";

// Services
import { createServiceOffer, updateServiceOffer } from "@/services/service-offer.api";
import { strictDeepMerge } from "@/utils";
import { CreateServiceOfferDto, UpdateServiceOfferDto } from "@shared/dtos";
import type { TCreateServiceOfferData, TUpdateServiceOfferData } from '@shared/types/service-offer.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useAuthUser } from "@/hooks/use-auth-user";
import { EUserLevels } from "@shared/enums";
import type { IStaff } from "@shared/interfaces/staff.interface";

export type TServiceOfferExtraProps = {
  trainer?: IStaff;
};

interface IServiceOfferFormProps extends THandlerComponentProps<TSingleHandlerStore<IServiceOffer, TServiceOfferExtraProps>> {}

export default function ServiceOfferForm({
    storeKey,
    store,
}: IServiceOfferFormProps) {
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { user } = useAuthUser();

    const queryClient = useQueryClient();
    const { t } = useI18n();

    if (!store) {
        return <div>{buildSentence(t, 'single', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const { action, response, isLoading, setAction, reset, extra } = store(useShallow(state => ({
        action: state.action,
        response: state.response,
        isLoading: state.isLoading,
        setAction: state.setAction,
        reset: state.reset,
        extra: state.extra,
    })));

    const trainer = extra.trainer ?? null;

    const getInitialTrainer = () => {
        if (trainer) {
          return {
            id: trainer.id,
            user: trainer.user ? {
              id: trainer.user.id,
              firstName: trainer.user.firstName,
              lastName: trainer.user.lastName,
              email: trainer.user.email,
            } : undefined,
          };
        }
        return null;
      };

    const initialValues = useMemo(() => {
        const INITIAL_VALUES: TCreateServiceOfferData = {
            name: "",
            offerPrice: 0,
            discount: 0,
            status: undefined,
            trainer: getInitialTrainer(),
            trainerService: undefined as any,
        };
        return strictDeepMerge<TCreateServiceOfferData>(INITIAL_VALUES, response ?? {});
    }, [response, user]);

    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;
    const mutationFn = isEditing ? updateServiceOffer(response.id) : createServiceOffer;
    const dto = isEditing ? UpdateServiceOfferDto : CreateServiceOfferDto;

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div data-component-id={componentId}>
            <FormHandler<TCreateServiceOfferData, IMessageResponse, IServiceOfferFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={ServiceOfferFormModal}
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

