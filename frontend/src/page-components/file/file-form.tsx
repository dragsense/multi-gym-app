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
import { type IFileUpload } from "@shared/interfaces/file-upload.interface";
import { type IMessageResponse } from "@shared/interfaces/api/response.interface";

// Store
import { type TSingleHandlerStore } from "@/stores";

// Components
import { FileFormModal, type IFileFormModalExtraProps } from "@/components/admin";

// Services
import { createFile, updateFile } from "@/services/file.api";
import { strictDeepMerge } from "@/utils";
import { CreateFileUploadDto, UpdateFileUploadDto } from "@shared/dtos";
import { EFileType } from "@shared/enums";
import type { TFileUploadData } from '@shared/types';
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export type TFileExtraProps = {};

interface IFileFormProps extends THandlerComponentProps<TSingleHandlerStore<IFileUpload, TFileExtraProps>> {}

export default function FileForm({
    storeKey,
    store,
}: IFileFormProps) {
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

    if (isLoading) {
        return (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }


    // React 19: Memoized initial values with deferred processing
    const initialValues = useMemo(() => {
        const INITIAL_VALUES: TFileUploadData = {
            name: "",
            url: "",
            type: EFileType.OTHER,
            file: undefined,
            folder: "general",
        };
        return strictDeepMerge<TFileUploadData>(INITIAL_VALUES, response ?? {});
    }, [response]);

    // React 19: Deferred initial values for performance
    const deferredInitialValues = useDeferredValue(initialValues);

    // React 19: Enhanced handler with transitions
    const handleClose = useCallback(() => {
        startTransition(() => {
            reset();
            setAction('none');
        });
    }, [reset, setAction, startTransition]);

    const isEditing = !!response?.id;
    const mutationFn = isEditing ? updateFile(response.id) : createFile;
    const dto = isEditing ? UpdateFileUploadDto : CreateFileUploadDto;

    return (
        <div data-component-id={componentId}>
            <FormHandler<TFileUploadData, IMessageResponse, IFileFormModalExtraProps>
                mutationFn={mutationFn}
                FormComponent={FileFormModal}
                storeKey={storeKey}
                initialValues={deferredInitialValues}
                dto={dto}
                validationMode={EVALIDATION_MODES.OnSubmit}
                isEditing={isEditing}
                onSuccess={() => {
                    startTransition(() => {
                        queryClient.invalidateQueries({ queryKey: [storeKey + "-list"] });
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

