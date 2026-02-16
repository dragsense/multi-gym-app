// External Libraries
import React from "react";
// Custom Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { UserMinus, Loader2, UserCog } from "lucide-react";

// Types
import type { UserDto } from "@shared/dtos";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { IChatUser } from "@shared/interfaces";

// Components
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface IChatParticipantsModalProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  participants: IChatUser[];
  isLoading?: boolean;
  isGroup?: boolean;
  onRemoveUser: (chatId: string, userId: string) => void;
  onMakeAdmin: (chatId: string, userId: string) => void;
  removingUserId?: string | null;
  makingAdminUserId?: string | null;
}

const ChatParticipantsModal = React.memo(function ChatParticipantsModal({
  open,
  onClose,
  chatId,
  participants,
  isLoading = false,
  isGroup = false,
  onRemoveUser,
  onMakeAdmin,
  removingUserId,
  makingAdminUserId,
}: IChatParticipantsModalProps) {
  const { t } = useI18n();
  const { user } = useAuthUser();

  if (!participants || participants.length === 0) return null;

  const admins = participants.filter((participant: IChatUser) => participant.isAdmin).map((participant: IChatUser) => participant.user?.id);
  const isCurrentUserAdmin = admins.includes(user?.id);
  
  const handleRemoveUser = (userId: string) => {
    onRemoveUser(chatId, userId);
  };

  const handleMakeAdmin = (userId: string) => {
    onMakeAdmin(chatId, userId);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <AppDialog
          title={buildSentence(t, "chat", "participants")}
          description={buildSentence(t, "view", "all", "participants", "in", "this", "chat")}
        >
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : participants.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>{buildSentence(t, "no", "participants", "found")}</p>
              </div>
            ) : (
              participants.map((participant: any) => {
                const participantUser = participant.user;
                const isCurrentUser = participantUser.id === user?.id;
                const firstName = participantUser?.firstName || "";
                const lastName = participantUser?.lastName || "";
                const fullName = `${firstName} ${lastName}`.trim() || participantUser?.email || "User";
                const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";

                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{fullName}</p>
                          {participant.isAdmin && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              {t("admin")}
                            </span>
                          )}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground">
                              ({t("you")})
                            </span>
                          )}
                        </div>
                        {participant.email && (
                          <p className="text-xs text-muted-foreground truncate">
                            {participant.email}
                          </p>
                        )}
                      </div>
                    </div>
                    {isGroup && isCurrentUserAdmin && !isCurrentUser && (
                      <div className="flex items-center gap-1">
                        {!participant.isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors"
                            onClick={() => handleMakeAdmin(participant.user?.id)}
                            disabled={makingAdminUserId === participant.user?.id}
                            title={buildSentence(t, "make", "admin")}
                          >
                            {makingAdminUserId === participant.user?.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserCog className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          onClick={() => handleRemoveUser(participant.user?.id)}
                          disabled={removingUserId === participant.user?.id}
                          title={buildSentence(t, "remove", "user")}
                        >
                          {removingUserId === participant.user?.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserMinus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
});

export { ChatParticipantsModal };

