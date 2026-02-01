// React
import React, { useId, useMemo, useTransition } from "react";

// Types
import type { TCreateMemberNoteData } from "@shared/types/member-note.type";
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";

// Components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form-ui/form";
import { AppCard } from "@/components/layout-ui/app-card";
import { Loader2 } from "lucide-react";

// Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

interface IMemberNoteFormProps extends THandlerComponentProps<TFormHandlerStore<TCreateMemberNoteData, any, any>> {}

export const MemberNoteForm = React.memo(function MemberNoteForm({
  storeKey,
  store,
}: IMemberNoteFormProps) {
  // React 19: Essential IDs and transitions
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  if (!store) {
    return `Form store "${storeKey}" not found. Did you forget to register it?`;
  }

  const isSubmitting = store((state) => state.isSubmitting);

  // React 19: Memoized fields for better performance
  const storeFields = store((state) => state.fields);

  const fields = useMemo(
    () =>
      ({
        ...storeFields,
      } as TFieldConfigObject<TCreateMemberNoteData>),
    [storeFields]
  );

  const inputs = useInput<TCreateMemberNoteData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TCreateMemberNoteData>;

  return (
    <Form<TCreateMemberNoteData, any> formStore={store}>
      <AppCard
        footer={
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting} data-component-id={componentId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("save")}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {inputs.generalInfo}
          {inputs.medicalConditions}
          {inputs.allergies}
          {inputs.physicianName}
          {inputs.medications}
        </div>
      </AppCard>
    </Form>
  );
});

