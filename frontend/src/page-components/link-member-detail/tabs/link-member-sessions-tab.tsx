// React
import { useId } from "react";

// Types
import type { ILinkMember } from "@shared/interfaces/link-member.interface";
import type { IMember } from "@shared/interfaces/member.interface";
import type { ISession } from "@shared/interfaces/session.interface";
import type { TSessionExtraProps } from "@/page-components/session/session-form";

// Handlers
import { SingleHandler } from "@/handlers";

// Components
import { SessionView } from "@/components/admin/sessions";

// Services
import { fetchSession } from "@/services/session.api";

// Page Components
import {
  SessionForm,
  SessionCancel,
  SessionReactivate,
  SessionComplete,
  SessionPayment,
  SessionNotes,
  SessionDelete,
  SessionCalendar,
} from "@/page-components/session";

interface ILinkMemberSessionsTabProps {
  linkMember: ILinkMember;
  member: IMember;
  storeKey: string;
}

export function LinkMemberSessionsTab({ linkMember, member, storeKey }: ILinkMemberSessionsTabProps) {
  const componentId = useId();

  const SESSIONS_STORE_KEY = `${storeKey}-sessions`;

  return (
    <div data-component-id={componentId} className="space-y-6">
      <SingleHandler<ISession, TSessionExtraProps>
        queryFn={fetchSession}
        initialParams={{
          _relations: "members.user, trainer.user",
          _select:
            "trainer.id, trainer.user.email, trainer.user.firstName, trainer.user.lastName, members.id, members.user.email, members.user.firstName, members.user.lastName",
        }}
        storeKey={SESSIONS_STORE_KEY}
        SingleComponent={SessionView}
        singleProps={{
          member: member,
        }}
        actionComponents={[
          {
            action: "pay",
            comp: SessionPayment,
          },
          {
            action: "notes",
            comp: SessionNotes,
          },
        ]}
      />

      <SessionCalendar storeKey={SESSIONS_STORE_KEY} memberId={member.id} />
    </div>
  );
}
