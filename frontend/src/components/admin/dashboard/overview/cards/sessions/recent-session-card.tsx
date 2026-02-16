import React, { useId } from "react";

// Types
import type { ISession } from "@shared/interfaces/session.interface";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Hooks
import { useUpcomingSessions } from "@/hooks/use-upcoming-sessions";
import { ESessionStatus, getSessionStatusColor } from "@shared/enums/session.enum";
import { DateTime } from "luxon";
import { formatDate } from "@/lib/utils";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface RecentSessionCardProps {
  data?: any; // Keep for backward compatibility but not used
  isLoading?: boolean;
  error?: Error | null;
}

const PAGINATION_LIMIT = 3;
const DEFAULT_LIMIT = 100;
const DEFAULT_START_DATE = DateTime.now().startOf('day').toISO();
const DEFAULT_END_DATE = DateTime.now().plus({ days: 10 }).endOf('day').toISO();

export default function RecentSessionCard({ isLoading: externalLoading, error }: RecentSessionCardProps) {
  const componentId = useId();
  const { t } = useI18n();

  // Fetch sessions using hook with pagination
  const { data: sessions, isLoading: sessionsLoading, pagination, setPage, setLimit } = useUpcomingSessions({
    params: {
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
      statuses: [ESessionStatus.SCHEDULED, ESessionStatus.RESCHEDULED],
      limit: DEFAULT_LIMIT,
    },
  }, PAGINATION_LIMIT);

  const isLoading = externalLoading || sessionsLoading;
  const sessionsList = sessions || [];

  return (
    <AppCard
      header={
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{buildSentence(t, 'upcoming', 'sessions')}</h3>
        </div>
      }
      data-component-id={componentId}
      loading={isLoading}
    >
      {error ? (
        <div className="p-4 text-red-500">{buildSentence(t, 'error', 'loading', 'sessions')}</div>
      ) : sessionsList.length > 0 ? (
        <>
          <div className="space-y-2">
            {sessionsList.map((session) => (
              <SessionItem key={session.id} session={session} />
            ))}
          </div>
          {pagination.total > PAGINATION_LIMIT && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
        <div className="text-center py-4 text-muted-foreground">
          No sessions found
        </div>
      )}
    </AppCard>
  );
}

// SessionItem component
interface ISessionItemProps {
  session: ISession;
}

function SessionItem({ session }: ISessionItemProps) {
  const componentId = useId();
  const { settings } = useUserSettings();

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

  return (
    <div data-component-id={componentId} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
      <div className="flex-1">
        <div className="font-medium">{session.title || 'Session'}</div>
        <div className="flex items-center gap-2 mt-1">
          {session.startDateTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDate(session.startDateTime, settings)}
            </div>
          )}
          {session.trainer && (
            <div className="text-xs text-muted-foreground">
              Trainer: {session.trainer.user?.firstName} {session.trainer.user?.lastName}
            </div>
          )}
        </div>
      </div>
      <Badge className={getSessionStatusColor(statusToShow, "badge")}>
        {statusToShow}
      </Badge>
    </div>
  );
}

