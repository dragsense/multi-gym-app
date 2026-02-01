import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";

// Types
import type { ISession } from "@shared/interfaces/session.interface";
import type { IMember } from "@shared/interfaces/member.interface";
import type { IStaff } from "@shared/interfaces/staff.interface";

// Handlers
import { ListHandler, SingleHandler } from "@/handlers";

// Components
import { SessionList, SessionView } from "@/components/admin";
import { SessionCalendar } from "@/page-components/session";

// Services
import {
  fetchSessions,
  fetchSession,
  deleteSession,
} from "@/services/session.api";
import { getMyMember } from "@/services/member.api";
import { getCurrentUserStaff } from "@/services/staff.api";

// Page Components
import {
  SessionForm,
  SessionCancel,
  SessionReactivate,
  SessionComplete,
  SessionPayment,
  SessionNotes,
  SessionDelete,
} from "@/page-components/session";

// Layouts
import { PageInnerLayout } from "@/layouts";
import type { ISessionListExtraProps } from "@/components/admin/sessions/list/session-list";
import type { TSessionListData } from "@shared/types";
import { SessionListDto } from "@shared/dtos/session-dtos/session.dto";
import { getSelectedLocation } from "@/utils/location-storage";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { List, Calendar as CalendarIcon } from "lucide-react";
import type { TSessionExtraProps } from "@/page-components/session/session-form";

export default function SessionsPage() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"list" | "calendar">("calendar");

  const SESSIONS_STORE_KEY = "session";
  const location = getSelectedLocation();

  // Fetch current user's member and trainer information
  const { data: myMember } = useQuery<IMember | null>({
    queryKey: ["myMember"],
    queryFn: getMyMember,
  });

  const { data: currentUserStaff } = useQuery<IStaff | null>({
    queryKey: ["currentUserStaff"],
    queryFn: getCurrentUserStaff,
  });

  const myTrainer = currentUserStaff?.isTrainer ? currentUserStaff : undefined;

  return (
    <PageInnerLayout Header={<Header />}>
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
          member: myMember || undefined,
          trainer: myTrainer,
        }}
        actionComponents={[
          {
            action: "createOrUpdate",
            comp: SessionForm,
          },
          {
            action: "cancel",
            comp: SessionCancel,
          },
          {
            action: "reactivate",
            comp: SessionReactivate,
          },
          {
            action: "complete",
            comp: SessionComplete,
          },
          {
            action: "pay",
            comp: SessionPayment,
          },
          {
            action: "notes",
            comp: SessionNotes,
          },
          {
            action: "delete",
            comp: SessionDelete,
          },
        ]}
      />

      <Tabs
        value={activeView}
        onValueChange={(value) => setActiveView(value as "list" | "calendar")}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ListHandler<
            ISession,
            TSessionListData,
            ISessionListExtraProps,
            ISession,
            TSessionViewExtraProps
          >
            queryFn={(params) => fetchSessions(params, location?.id)}
            deleteFn={deleteSession}
            onDeleteSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: [SESSIONS_STORE_KEY + "-calendar"],
              });
              queryClient.invalidateQueries({
                queryKey: [SESSIONS_STORE_KEY + "-list"],
              });
            }}
            initialParams={{
              _relations: "members, trainer.user",
              _select:
                "trainer.user.email, trainer.user.firstName, trainer.user.lastName",
              _countable: "members",
              filters: {},
            }}
            ListComponent={SessionList}
            dto={SessionListDto}
            storeKey={SESSIONS_STORE_KEY}
            listProps={{}}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <SessionCalendar storeKey={SESSIONS_STORE_KEY} />
        </TabsContent>
      </Tabs>
    </PageInnerLayout>
  );
}

const Header = () => null;
