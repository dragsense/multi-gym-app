// External Libraries
import React, { useId, useMemo, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Custom Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";

// Types
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from "@shared/dtos";
import type {
  TCreateEmailTemplateData,
  TUpdateEmailTemplateData,
} from "@shared/types/cms.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form-ui/form";
import { FormErrors } from "@/components/shared-ui/form-errors";
import { PuckEditor } from "@/components/admin/cms/components/puck-editor";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { buildSentence } from "@/locales/translations";

export interface IEmailTemplateFormExtraProps { }

interface IEmailTemplateFormProps
  extends THandlerComponentProps<
    TFormHandlerStore<
      CreateEmailTemplateDto | UpdateEmailTemplateDto,
      IMessageResponse,
      IEmailTemplateFormExtraProps
    >
  > { }

const EmailTemplateForm = React.memo(function EmailTemplateForm({
  storeKey,
  store,
}: IEmailTemplateFormProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuthUser();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const fields = store((state) => state.fields);
  const isSubmitting = store((state) => state.isSubmitting);
  const isEditing = store((state) => state.isEditing);
  const values = store((state) => state.values);

  const memoizedFields = useMemo(() => {
      return {
        ...fields,
        name: {
          ...fields.name,
          placeholder: buildSentence(t, "enter", "name"),
          label: buildSentence(t, "name"),
        },
        identifier: {
          ...fields.identifier,
          placeholder: buildSentence(t, "enter", "identifier"),
          label: buildSentence(t, "identifier"),
        },
        subject: {
          ...fields.subject,
          placeholder: buildSentence(t, "enter", "subject"),
          label: buildSentence(t, "subject"),
        },
        description: {
          ...fields.description,
          placeholder: buildSentence(t, "enter", "description"),
          label: buildSentence(t, "description"),
        },
        isActive: {
          ...fields.isActive,
          label: buildSentence(t, "isActive"),
        },
      } as TFieldConfigObject<TCreateEmailTemplateData>;
  }, [fields]);

  const inputs = useInput<TCreateEmailTemplateData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateEmailTemplateData>;

  const handleCancel = () => {
    if (!user) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      navigate(`${segment}/${ADMIN_ROUTES.CMS.EMAIL_TEMPLATES}`);
    });
  };

  const formButtons = useMemo(
    () => (
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
        >
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t("updateEmailTemplate") : t("createEmailTemplate")}
        </Button>
      </div>
    ),
    [handleCancel, isSubmitting, isEditing, t]
  );

  return (
    <div data-component-id={componentId}>

      <Form<
        TCreateEmailTemplateData | TUpdateEmailTemplateData,
        IMessageResponse,
        IEmailTemplateFormExtraProps
      >
        formStore={store}
        className="space-y-6"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("emailTemplateInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.name}
              {inputs.identifier}
              {inputs.subject}
              {inputs.description}
              {inputs.isActive}
            </div>
          </div>

          {/* PUCK Editor */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">{t("content")}</h3>
            <PuckEditor 
              fieldName="content" 
              data={values.content}
              availableVariables={values.availableVariables || []}
            />
          </div>
        </div>
        <FormErrors />
        <div className="flex justify-end gap-2 pt-4 border-t">
          {formButtons}
        </div>
      </Form>
    </div>
  );
});

export default EmailTemplateForm;
