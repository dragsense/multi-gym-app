// React
import React, { useId, useMemo, useTransition } from "react";

// Types
import type { TLinkMemberData } from "@shared/types/link-member.type";
import type { TFormHandlerStore } from "@/stores";
import type { THandlerComponentProps } from "@/@types/handler-types";

// Components
import { Button } from "@/components/ui/button";
import { Form } from "@/components/form-ui/form";
import { AppCard } from "@/components/layout-ui/app-card";
import { Loader2 } from "lucide-react";
import { SearchableInputWrapper } from "@/components/shared-ui/searchable-input-wrapper";
import { useSearchableMembers } from "@/hooks/use-searchable";
import type { TCustomInputWrapper } from "@/@types/form/field-config.type";
import type { MemberDto } from "@shared/dtos";

// Hooks
import { type FormInputs, useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

interface ILinkMemberFormProps
  extends THandlerComponentProps<TFormHandlerStore<TLinkMemberData, any, any>> {}


const LinkedMemberSelect = React.memo((props: TCustomInputWrapper) => {
  const { t } = useI18n();
  const searchableMembers = useSearchableMembers({});
  
  return (
    <SearchableInputWrapper<MemberDto>
      {...props}
      modal={true}
      useSearchable={() => searchableMembers}
      getLabel={(item) => {
        if (!item?.user?.firstName) return buildSentence(t, "select", "member");
        return `${item.user?.firstName} ${item.user?.lastName} (${item.user?.email})`;
      }}
      getKey={(item) => item.id.toString()}
      getValue={(item) => {
        return { id: item.id, user: item.user };
      }}
      shouldFilter={false}
    />
  );
});

export const LinkMemberForm = React.memo(function LinkMemberForm({
  storeKey,
  store,
}: ILinkMemberFormProps) {
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
       
        linkedMember: {
          ...storeFields.linkedMember,
          type: "custom" as const,
          Component: LinkedMemberSelect,
          label: buildSentence(t, "link", "member"),
        },
        viewSessionCheck: {
          ...storeFields.viewSessionCheck,
          label: buildSentence(t, "view", "session", "check"),
        },
        notes: {
          ...storeFields.notes,
          label: buildSentence(t, "notes"),
          placeholder: buildSentence(t, "enter", "notes", "optional"),
        },
      } as TFieldConfigObject<TLinkMemberData>),
    [storeFields, t]
  );

  const inputs = useInput<TLinkMemberData>({
    fields,
    showRequiredAsterisk: true,
  }) as FormInputs<TLinkMemberData>;

  return (
    <Form<TLinkMemberData, any> formStore={store}>
      <AppCard
        footer={
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isSubmitting} data-component-id={componentId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {buildSentence(t, "create", "link")}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {inputs.linkedMember}
          {inputs.viewSessionCheck}
          {inputs.notes}
        </div>
      </AppCard>
    </Form>
  );
});
