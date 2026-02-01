// React
import { useId } from "react";

// Types
import type { ISession } from "@shared/interfaces/session.interface";

// Components
import { Calendar, Clock, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Hooks
import { useMySessions } from "@/hooks/use-my-sessions";
import { ESessionStatus, getSessionStatusColor } from "@shared/enums/session.enum";
import { formatDate } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { AppCard } from "@/components/layout-ui/app-card";

const PAGINATION_LIMIT = 4;

/**
 * Card component that displays recent/upcoming sessions for the logged-in trainer
 * Uses useMySessions hook directly - no props needed
 */
export function TrainerRecentSessionsCard() {
  const componentId = useId();
  const { t } = useI18n();

  // Fetch sessions using hook with pagination
  const { data: sessions, isLoading, pagination, setPage } = useMySessions(PAGINATION_LIMIT);

  const sessionsList = sessions || [];

  return (
    <div data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">{t("upcomingSessions") || "Upcoming Sessions"}</h3>
          </div>
        }
        data-component-id={componentId}
        loading={isLoading}
      >
        {sessionsList.length > 0 ? (
          <>
            <div className="space-y-3">
              {sessionsList.map((session) => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
            {pagination.total > PAGINATION_LIMIT && (
              <div className="flex items-center justify-between pt-3 border-t mt-3">
                <div className="text-xs text-muted-foreground">
                  {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPage(pagination.page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">{t("noUpcomingSessions") || "No upcoming sessions"}</p>
            <p className="text-xs mt-1">{t("scheduleNewSession") || "Schedule a new session to get started"}</p>
          </div>
        )}
      </AppCard>
    </div>
  );
}

// SessionItem component
interface ISessionItemProps {
  session: ISession;
}

function SessionItem({ session }: ISessionItemProps) {
  const componentId = useId();
  const { settings } = useUserSettings();
  const { t } = useI18n();

  // Determine status to show (handle IN_PROGRESS and PASSED based on time)
  let statusToShow = session.status as ESessionStatus;
  if (session.startDateTime && session.endDateTime) {
    const now = new Date();
    const start = new Date(session.startDateTime);
    const end = new Date(session.endDateTime);
    if (
      now >= start &&
      now < end &&
      statusToShow !== ESessionStatus.CANCELLED &&
      statusToShow !== ESessionStatus.COMPLETED
    ) {
      statusToShow = ESessionStatus.IN_PROGRESS;
    }
    if (
      end &&
      now >= end &&
      statusToShow !== ESessionStatus.CANCELLED &&
      statusToShow !== ESessionStatus.COMPLETED
    ) {
      statusToShow = ESessionStatus.PASSED;
    }
  }

  // Get member info from session
  const member = (session as any).member;
  const memberUser = member?.user;
  const memberName = memberUser
    ? `${memberUser.firstName || ''} ${memberUser.lastName || ''}`.trim()
    : t("member") || "Member";
  const memberInitials = memberUser
    ? `${memberUser.firstName?.[0] || ''}${memberUser.lastName?.[0] || ''}`.toUpperCase()
    : "M";

  return (
    <div
      data-component-id={componentId}
      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
    >
      {/* Member Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={memberUser?.avatar} alt={memberName} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {memberInitials}
        </AvatarFallback>
      </Avatar>

      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{session.title || t("session") || 'Session'}</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {session.startDateTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(session.startDateTime, settings)}
            </div>
          )}
          {memberUser && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {memberName}
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <Badge className={`${getSessionStatusColor(statusToShow, "badge")} text-xs flex-shrink-0`}>
        {statusToShow}
      </Badge>
    </div>
  );
}
