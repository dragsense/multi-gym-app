// React
import { useId, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { TCreateMemberNoteData } from "@shared/types/member-note.type";
import type { IMemberNote } from "@shared/interfaces/member-note.interface";
import type { IMessageResponse } from "@shared/interfaces/api/response.interface";

// Handlers
import { FormHandler, ListHandler } from "@/handlers";

// Components
import { MemberNoteForm } from "@/components/admin/member-notes/form/member-note-form";
import { MemberNoteList } from "@/components/admin/member-notes/list/member-note-list";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Services
import { createMemberNote, fetchMemberNotes, deleteMemberNote } from "@/services/member-note.api";

// DTOs
import { CreateMemberNoteDto, MemberNoteListDto } from "@shared/dtos";

// Enums
import { EVALIDATION_MODES } from "@/enums/form.enums";

// Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface IMemberNotesTabProps {
  member: IMember;
  storeKey: string;
}

export function MemberNotesTab({ member, storeKey }: IMemberNotesTabProps) {
  const componentId = useId();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const NOTES_FORM_STORE_KEY = `${storeKey}-notes-form`;
  const NOTES_LIST_STORE_KEY = `${storeKey}-notes-list`;
  
  const [accordionValue, setAccordionValue] = useState<string>("");

  const INITIAL_VALUES: TCreateMemberNoteData = useMemo(
    () => ({
      memberId: member.id,
      generalInfo: "",
      medicalConditions: "",
      allergies: [],
      physicianName: "",
      medications: [],
    }),
    [member.id]
  );

  return (
    <div data-component-id={componentId} className="space-y-6">
      {/* Form Handler - Add New Note */}
      <Accordion
        type="single"
        collapsible
        value={accordionValue}
        onValueChange={setAccordionValue}
      >
        <AccordionItem value="add-note">
          <AccordionTrigger>
            {buildSentence(t, "add", "new", "note")}
          </AccordionTrigger>
          <AccordionContent>
            <FormHandler<TCreateMemberNoteData, IMemberNote | IMessageResponse>
              mutationFn={(data) => createMemberNote(data)}
              FormComponent={MemberNoteForm}
              initialValues={INITIAL_VALUES}
              validationMode={EVALIDATION_MODES.OnSubmit}
              dto={CreateMemberNoteDto}
              storeKey={NOTES_FORM_STORE_KEY}
              onSuccess={() => {
                // Close accordion after successful submission
                setAccordionValue("");
                // Invalidate queries to refresh the list
                queryClient.invalidateQueries({
                  queryKey: [NOTES_LIST_STORE_KEY + "-list"],
                });
              }}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* List Handler - Show All Notes */}
      <ListHandler<IMemberNote, any, any>
        queryFn={(params) => fetchMemberNotes({ ...params, memberId: member.id } as any)}
        initialParams={{
          sortBy: "createdAt",
          sortOrder: "DESC",
        } as any}
        ListComponent={MemberNoteList}
        deleteFn={deleteMemberNote}
        onDeleteSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: [NOTES_LIST_STORE_KEY + "-list"],
          });
        }}
        dto={MemberNoteListDto}
        storeKey={NOTES_LIST_STORE_KEY}
        listProps={{}}
      />
    </div>
  );
}
