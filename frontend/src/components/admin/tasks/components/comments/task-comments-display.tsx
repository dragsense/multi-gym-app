// React & Hooks
import { useId, useTransition, useCallback, useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import { useUserSettings } from "@/hooks/use-user-settings";
import { buildSentence } from "@/locales/translations";
import { formatDateTime } from "@/lib/utils";
import { useRegisteredStore } from "@/stores/store-registry";

// External libraries
import { Plus, Edit, Trash2, MessageSquare } from "lucide-react";

// Types
import { type ITaskComment } from "@shared/interfaces/task.interface";
import type { TSingleHandlerStore } from "@/stores";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/layout-ui/app-alert-dialog";

interface ITaskCommentsDisplayProps {
  taskId: string;
  storeKey: string;
  comments: ITaskComment[];
  isLoading?: boolean;
  error?: Error | null;
  onRefetch: () => void;
  onDelete: (commentId: string) => Promise<void>;
}

export function TaskCommentsDisplay({
  taskId,
  storeKey,
  comments = [],
  isLoading = false,
  error = null,
  onRefetch,
  onDelete,
}: ITaskCommentsDisplayProps) {
  const componentId = useId();
  const { t } = useI18n();
  const { settings } = useUserSettings();
  const [, startTransition] = useTransition();

  // Get store using store key
  const singleStore = useRegisteredStore<TSingleHandlerStore<ITaskComment, any>>(
    storeKey + "-single"
  );

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const handleDeleteClick = useCallback((commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (commentToDelete) {
      try {
        await onDelete(commentToDelete);
        startTransition(() => {
          onRefetch();
        });
        setDeleteDialogOpen(false);
        setCommentToDelete(null);
      } catch (error) {
        console.error("Failed to delete comment:", error);
      }
    }
  }, [commentToDelete, onDelete, onRefetch]);

  const handleEdit = useCallback(
    (commentId: string) => {
      if (singleStore) {
        startTransition(() => {
          singleStore.getState().setExtra("taskId", taskId);
          singleStore.getState().setAction("createOrUpdate", commentId);
        });
      }
    },
    [singleStore]
  );

  const handleCreate = useCallback(() => {
    if (singleStore) {
      startTransition(() => {
        singleStore.getState().setExtra("taskId", taskId);
        singleStore.getState().setAction("createOrUpdate");
      });
    }
  }, [singleStore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        {buildSentence(t, "failed", "to", "load", "comments")}
      </div>
    );
  }

  return (
    <div data-component-id={componentId} className="space-y-4">
      {/* Add Comment Button */}
      <div className="flex justify-end">
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          {buildSentence(t, "add", "comment")}
        </Button>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            {buildSentence(t, "no", "comments", "yet")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {buildSentence(t, "be", "the", "first", "to", "comment")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto">
          {comments.map((comment) => {
            const userName =
              comment.createdBy?.firstName && comment.createdBy?.lastName
                ? `${comment.createdBy.firstName} ${comment.createdBy.lastName}`
                : comment.createdBy?.email || "Unknown User";
            const userInitials = userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .substring(0, 2);

            return (
              <div
                key={comment.id}
                className="flex gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={(comment.createdBy as any)?.profile?.avatar}
                    alt={userName}
                  />
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                {/* Comment Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{userName}</p>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt
                          ? formatDateTime(comment.createdAt, settings)
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEdit(comment.id)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(comment.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Comment Text */}
                  <div className="text-sm whitespace-pre-wrap break-words text-foreground">
                    {comment.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={buildSentence(t, "delete", "comment")}
        description={buildSentence(
          t,
          "are",
          "you",
          "sure",
          "you",
          "want",
          "to",
          "delete",
          "this",
          "comment"
        )}
        confirmText={buildSentence(t, "delete")}
        cancelText={buildSentence(t, "cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

