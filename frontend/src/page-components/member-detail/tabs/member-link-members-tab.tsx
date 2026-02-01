// React
import { useId, useMemo, useState, useTransition, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { TLinkMemberData } from "@shared/types/link-member.type";
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";
import type { TListHandlerStore } from "@/stores";
import type { TListHandlerComponentProps } from "@/@types/handler-types";

// Handlers
import { FormHandler, ListHandler } from "@/handlers";

// Components
import { LinkMemberForm } from "@/components/admin/link-members/form/link-member-form";
import { LinkMemberList } from "@/components/admin/link-members/list/link-member-list-view";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Services
import {
  createLinkMember,
  fetchLinkMembers,
  deleteLinkMember,
  toggleViewSessionCheck,
} from "@/services/link-member.api";

// DTOs
import { CreateLinkMemberDto, LinkMemberListDto } from "@shared/dtos";

// Enums
import { EVALIDATION_MODES } from "@/enums/form.enums";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

// Toggle Action Component
function LinkMemberToggleAction({
  storeKey,
  store,
}: TListHandlerComponentProps<TListHandlerStore<ILinkMember, any, any>>) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [, startTransition] = useTransition();

  if (!store) {
    return null;
  }

  const { action, payload, setAction } = store(
    useShallow((state) => ({
      action: state.action,
      payload: state.payload,
      setAction: state.setAction,
    }))
  );

  const linkMemberId = payload as string | undefined;
  const isActive = action === "toggleViewSession" && !!linkMemberId;

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      return toggleViewSessionCheck(id);
    },
    onSuccess: () => {
      startTransition(() => {
        queryClient.invalidateQueries({
          queryKey: [storeKey + "-list"],
        });
        queryClient.invalidateQueries({
          queryKey: [`link-member-${linkMemberId}`],
        });
        setAction("", null);
        toast.success(
          buildSentence(t, "session", "check", "updated", "successfully")
        );
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : buildSentence(t, "failed", "to", "update")
      );
      setAction("", null);
    },
  });

  // Auto-trigger the mutation when action is set
  useEffect(() => {
    if (isActive && linkMemberId && !toggleMutation.isPending) {
      toggleMutation.mutate(linkMemberId);
    }
  }, [isActive, linkMemberId, toggleMutation.isPending, toggleMutation.mutate]);

  return null;
}

interface IMemberLinkMembersTabProps {
  member: IMember;
  storeKey: string;
}

export function MemberLinkMembersTab({
  member,
  storeKey,
}: IMemberLinkMembersTabProps) {
  const componentId = useId();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const LINK_MEMBERS_FORM_STORE_KEY = `${storeKey}-link-members-form`;
  const LINK_MEMBERS_LIST_STORE_KEY = `${storeKey}-link-members-list`;
  
  const [accordionValue, setAccordionValue] = useState<string>("");

  const INITIAL_VALUES: TLinkMemberData = useMemo(
    () => ({
      primaryMember: {
        id: member.id,
      },
      linkedMember: null,
      viewSessionCheck: false,
      notes: "",
    }),
    [member.id]
  );

  return (
    <div data-component-id={componentId} className="space-y-6">
      {/* Form Handler - Add New Link Member */}
      <Accordion
        type="single"
        collapsible
        value={accordionValue}
        onValueChange={setAccordionValue}
      >
        <AccordionItem value="add-link-member">
          <AccordionTrigger>
            {buildSentence(t, "add", "new", "link", "member")}
          </AccordionTrigger>
          <AccordionContent>
            <FormHandler<TLinkMemberData, ILinkMember | IMessageResponse>
              mutationFn={(data) => createLinkMember(data)}
              FormComponent={LinkMemberForm}
              initialValues={INITIAL_VALUES}
              validationMode={EVALIDATION_MODES.OnSubmit}
              dto={CreateLinkMemberDto}
              storeKey={LINK_MEMBERS_FORM_STORE_KEY}
              onSuccess={() => {
                // Close accordion after successful submission
                setAccordionValue("");
                // Invalidate queries to refresh the list
                queryClient.invalidateQueries({
                  queryKey: [LINK_MEMBERS_LIST_STORE_KEY + "-list"],
                });
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* List Handler - Show All Link Members */}
      <ListHandler<ILinkMember, any, any>
        queryFn={(params) => fetchLinkMembers({ ...params, primaryMemberId: member.id } as any)}
        initialParams={{
          _relations:"primaryMember.user, linkedMember.user",
          sortBy: "createdAt",
          sortOrder: "DESC",
        } as any}
        ListComponent={LinkMemberList}
        deleteFn={deleteLinkMember}
        onDeleteSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: [LINK_MEMBERS_LIST_STORE_KEY + "-list"],
          });
        }}
        dto={LinkMemberListDto}
        storeKey={LINK_MEMBERS_LIST_STORE_KEY}
        listProps={{}}
        actionComponents={[
          {
            action: "toggleViewSession",
            comp: LinkMemberToggleAction,
          },
        ]}
      />
    </div>
  );
}
