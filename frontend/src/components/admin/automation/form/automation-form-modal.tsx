// External Libraries
import React, { ReactNode, useMemo, useId, useTransition } from "react";
import { Loader2 } from "lucide-react";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useSearchableEmailTemplates } from "@/hooks/use-searchable";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { TAutomationData } from "@shared/types/automation.type";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { EmailTemplateDto } from "@shared/dtos";

// Components
import { Button } from "@/components/ui/button";
import { ModalForm } from "@/components/form-ui/modal-form";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { TCustomInputWrapper, TFieldConfigObject } from "@/@types/form/field-config.type";

// Custom component for email template selection
const EmailTemplateSelect = React.memo((props: TCustomInputWrapper) => {
    const searchableTemplates = useSearchableEmailTemplates({});
    const { t } = useI18n();
    return (
        <SearchableInputWrapper<EmailTemplateDto>
            {...props}
            modal={true}
            useSearchable={() => searchableTemplates}
            getLabel={(item) => {
                if (!item) return buildSentence(t, "select", "template");
                return item.name || item.identifier;
            }}
            getKey={(item) => item.id.toString()}
            getValue={(item) => {
                return {
                    id: item.id,
                    name: item.name,
                    identifier: item.identifier,
                    subject: item.subject,
                };
            }}
            shouldFilter={false}
        />
    );
});

export interface IAutomationFormModalExtraProps {
    open: boolean;
    onClose: () => void;
}

interface IAutomationFormModalProps extends THandlerComponentProps<TFormHandlerStore<TAutomationData, IMessageResponse, IAutomationFormModalExtraProps>> {
}

const AutomationFormModal = React.memo(function AutomationFormModal({
    storeKey,
    store,
}: IAutomationFormModalProps) {
    // React 19: Essential IDs and transitions
    const componentId = useId();
    const [, startTransition] = useTransition();
    const { t } = useI18n();

    if (!store) {
        return <div>{buildSentence(t, 'form', 'store')} "{storeKey}" {buildSentence(t, 'not', 'found')}. {buildSentence(t, 'did', 'you', 'forget', 'to', 'register', 'it')}?</div>;
    }

    const isEditing = store((state) => state.isEditing);
    const isSubmitting = store((state) => state.isSubmitting);

    const open = store((state) => state.extra.open);
    const onClose = store((state) => state.extra.onClose);

    // React 19: Memoized fields for better performance
    const storeFields = store((state) => state.fields);

    // React 19: Memoized fields for better performance
    const fields = useMemo(() => ({
        ...storeFields,
        name: {
            ...storeFields.name,
            label: buildSentence(t, "name"),
            placeholder: buildSentence(t, "enter", "automation", "name"),
        },
        emailTemplate: {
            ...storeFields.emailTemplate,
            type: "custom" as const,
            Component: EmailTemplateSelect,
            label: buildSentence(t, "select", "template"),
        },
        trigger: {
            ...storeFields.trigger,
            label: buildSentence(t, "trigger"),
        },
        format: {
            ...storeFields.format,
            label: buildSentence(t, "format"),
        },
        status: {
            ...storeFields.status,
            label: buildSentence(t, "status"),
        },
    } as TFieldConfigObject<TAutomationData>), [storeFields, t]);

    const inputs = useInput<TAutomationData>({
        fields,
        showRequiredAsterisk: true,
    }) as FormInputs<TAutomationData>;

    // React 19: Smooth modal state changes
    const onOpenChange = (state: boolean) => {
        if (state === false) {
            startTransition(() => {
                onClose();
            });
        }
    };

    // React 19: Memoized form buttons for better performance
    const formButtons = useMemo(() => (
        <div className="flex justify-end gap-2">
            <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                    e.preventDefault();
                    startTransition(() => {
                        onClose();
                    });
                }}
                disabled={isSubmitting}
                data-component-id={componentId}
            >
                {buildSentence(t, 'cancel')}
            </Button>
            <Button
                type="submit"
                disabled={isSubmitting}
                data-component-id={componentId}
            >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? buildSentence(t, 'update') : buildSentence(t, 'add')}
            </Button>
        </div>
    ), [isSubmitting, isEditing, componentId, t, onClose, startTransition]);

    return (
        <ModalForm<TAutomationData, IMessageResponse, IAutomationFormModalExtraProps>
            title={buildSentence(t, isEditing ? 'edit' : 'add', 'automation')}
            description={buildSentence(t, isEditing ? 'update' : 'add', 'automation', 'information')}
            open={open}
            onOpenChange={onOpenChange}
            formStore={store}
            footerContent={formButtons}
            width="xl"
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {inputs.name}
                    {inputs.emailTemplate as ReactNode}
                    {inputs.trigger}
                    {inputs.format}
                    {inputs.status}
                </div>
            </div>
        </ModalForm>
    );
});

export default AutomationFormModal;
