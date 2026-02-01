import React, { useMemo, useEffect, useState } from "react";
import { useShallow } from "zustand/shallow";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare } from "lucide-react";
import type { TListHandlerStore } from "@/stores";
import type { TicketReplyDto, TicketReplyListDto } from "@shared/dtos/ticket-dtos/ticket-reply.dto";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useAuthUser } from "@/hooks/use-auth-user";
import { formatDateTime, cn } from "@/lib/utils";

interface IRepliesProps {
  store: TListHandlerStore<TicketReplyDto, TicketReplyListDto, any>;
}

export function Replies({ store }: IRepliesProps) {
  const { t } = useI18n();
  const [accumulatedReplies, setAccumulatedReplies] = useState<TicketReplyDto[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { response: replies, isLoading, pagination, setPagination } = store(
    useShallow((state) => ({
      response: state.response,
      isLoading: state.isLoading,
      pagination: state.pagination,
      setPagination: state.setPagination,
    }))
  );

  // Accumulate replies when new data arrives
  useEffect(() => {
    if (!replies || replies.length === 0) return;

    const page = pagination?.page || 1;

    if (page === 1) {
      setAccumulatedReplies(replies);
      setCurrentPage(1);
    } else if (page > currentPage) {
      setAccumulatedReplies((prev) => [...prev, ...replies]);
      setCurrentPage(page);
    } else if (page === currentPage) {
      setAccumulatedReplies([...replies]);
    }
  }, [replies]);

  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !isLoading) {
      setPagination({ page: (pagination.page || 1) + 1 });
    }
  };

  if (isLoading && accumulatedReplies.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accumulatedReplies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">{buildSentence(t, "no", "replies", "yet")}</p>
      </div>
    );
  }

  return (
    <div>
        {pagination?.hasNextPage && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
   
    <div className="flex flex-col-reverse gap-3 py-2">
      {accumulatedReplies.map((reply) => (
        <ReplyItem key={reply.id} reply={reply} />
      ))}
    </div>
    </div>
  );
}

// Reply Item Component
const ReplyItem = React.memo(({ reply }: { reply: TicketReplyDto }) => {
  const { settings } = useUserSettings();
  const { t } = useI18n();
  const { user: currentUser } = useAuthUser();

  const createdDate = useMemo(
    () => formatDateTime(reply.createdAt, settings),
    [reply.createdAt, settings]
  );

  const userName = reply.createdBy
    ? `${reply.createdBy.firstName || ''} ${reply.createdBy.lastName || ''}`.trim() || reply.createdBy.email
    : "Unknown";

  const userInitials = reply.createdBy
    ? `${reply.createdBy.firstName?.[0] || ''}${reply.createdBy.lastName?.[0] || ''}`.toUpperCase() || "U"
    : "U";

  const isCurrentUser = reply.createdBy?.id === currentUser?.id;

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex max-w-[75%] sm:max-w-[65%] flex-col",
          isCurrentUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm",
          )}
        >
          {!isCurrentUser && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-xs opacity-90">{userName}</span>
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{reply.message}</p>
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {createdDate}
        </span>
      </div>
    </div>
  );
});
