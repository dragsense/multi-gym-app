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
import { type IAutomation } from "@shared/interfaces/automation.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { AutomationFormModal, type IAutomationFormModalExtraProps } from "@/components/admin/automation";

// Services
import { createAutomation, updateAutomation } from "@/services/automation.api";
import { strictDeepMerge } from "@/utils";
import { CreateAutomationDto, UpdateAutomationDto } from "@shared/dtos";
import type { TAutomationData } from '@shared/types/automation.type';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { EAutomationFormat, EAutomationStatus, EAutomationTrigger } from "@shared/enums";

export type TAutomationExtraProps = Record<string, unknown>;

interface IAutomationFormProps extends THandlerComponentProps<TSingleHandlerStore<IAutomation, TAutomationExtraProps>> { }

export default function AutomationForm({
    storeKey,
    store,
}: IAutomationFormProps) {
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
        reset: state.reset,
    })));

    const INITIAL_VALUES: TAutomationData = {
        name: "",
        emailTemplate: undefined,
        trigger: EAutomationTrigger.ONBOARD,
        format: EAutomationFormat.EMAIL,
        status: EAutomationStatus.INACTIVE,
        isActive: false,
    } as TAutomationData;

    const initialValues = useMemo(() => {
        return strictDeepMerge<TAutomationData>(INITIAL_VALUES, response ?? {});
    }, [response]);

    // React 19: Enhanced handler with transitions
    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;

    const mutationFn = useMemo(() => {
        return isEditing ? updateAutomation(response.id) : createAutomation;
    }, [isEditing, response?.id]);

    const dto = useMemo(() => {
        return isEditing ? UpdateAutomationDto : CreateAutomationDto;
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
            <FormHandler<TAutomationData, IMessageResponse, IAutomationFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={AutomationFormModal}
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
