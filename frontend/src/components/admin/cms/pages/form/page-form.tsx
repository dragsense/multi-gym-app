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
import { CreatePageDto, UpdatePageDto } from "@shared/dtos";
import type { TCreatePageData, TUpdatePageData } from "@shared/types/cms.type";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

// Components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form-ui/form";
import { FormErrors } from "@/components/shared-ui/form-errors";
import { PuckEditor } from "@/components/admin/cms/components/puck-editor";
import { ADMIN_ROUTES, SEGMENTS } from "@/config/routes.config";
import { useAuthUser } from "@/hooks/use-auth-user";
import { buildSentence } from "@/locales/translations";

export interface IPageFormExtraProps {}

interface IPageFormProps
  extends THandlerComponentProps<
    TFormHandlerStore<
      TCreatePageData | TUpdatePageData,
      IMessageResponse,
      IPageFormExtraProps
    >
  > {}

const PageForm = React.memo(function PageForm({
  storeKey,
  store,
}: IPageFormProps) {
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

  const isSystem = (values as any)?.isSystem || false;

  const memoizedFields = useMemo(() => {
    return {
      ...fields,
      title: {
        ...fields.title,
        placeholder: buildSentence(t, "enter", "title"),
        label: buildSentence(t, "title"),
      },
      slug: {
        ...fields.slug,
        placeholder: buildSentence(t, "enter", "slug"),
        label: buildSentence(t, "slug"),
        disabled: isSystem, // Disable slug editing for system pages
      },
      description: {
        ...fields.description,
        placeholder: buildSentence(t, "enter", "description"),
        label: buildSentence(t, "description"),
      },
      isPublished: {
        ...fields.isPublished,
        label: t("isPublished"),
      },
    } as TFieldConfigObject<TCreatePageData>;
  }, [fields]);

  const inputs = useInput<TCreatePageData>({
    fields: memoizedFields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreatePageData>;

  const handleCancel = () => {
    if (!user) return;
    const segment = SEGMENTS[user.level];
    startTransition(() => {
      navigate(`${segment}/${ADMIN_ROUTES.CMS.PAGES}`);
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
          {isEditing ? t("updatePage") : t("createPage")}
        </Button>
      </div>
    ),
    [handleCancel, isSubmitting, isEditing, t]
  );

  return (
    <div data-component-id={componentId} className="space-y-6">
      <Form<
        TCreatePageData | TUpdatePageData,
        IMessageResponse,
        IPageFormExtraProps
      >
        formStore={store}
        className="space-y-6"
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t("pageInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inputs.title}
              {inputs.slug}
              {inputs.description}
              {inputs.isPublished}
            </div>
          </div>

          {/* PUCK Editor */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">{t("content")}</h3>
            <PuckEditor fieldName="content" data={values.content} />
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

export default PageForm;
