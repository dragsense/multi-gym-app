// External Libraries
import React, { useMemo, useState, useEffect } from "react";
// Custom Hooks
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { UserPlus, Search } from "lucide-react";
import { useSearchableUsers } from "@/hooks/use-searchable";

// Types
import type { UserDto } from "@shared/dtos";
import type { IChatUser } from "@shared/interfaces";

// Components
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { AppDialog } from "@/components/layout-ui/app-dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface IChatAddUsersModalProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  onSubmit: (userId: string, userName: string) => void;
  isSubmitting?: boolean;
  existingParticipants?: IChatUser[];
}

const ChatAddUsersModal = React.memo(function ChatAddUsersModal({
  open,
  onClose,
  chatId,
  onSubmit,
  isSubmitting = false,
  existingParticipants = [],
}: IChatAddUsersModalProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const searchableUsers = useSearchableUsers({});
  
  // Update search filters when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchableUsers.setFilters({ search: search || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchableUsers]);
  
  // Get existing participant user IDs
  const existingUserIds = useMemo(() => {
    return new Set(existingParticipants.map((p: IChatUser) => p.user?.id).filter(Boolean));
  }, [existingParticipants]);

  const users = searchableUsers.response?.data || [];


  const handleAddUser = (userId: string, userName: string) => {
    onSubmit(userId, userName);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onClose();
        setSearch("");
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <AppDialog
          title={buildSentence(t, "add", "users", "to", "chat")}
          description={buildSentence(t, "search", "and", "select", "users", "to", "add", "to", "this", "chat")}
        >
          <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={buildSentence(t, "search", "users")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Users list */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {searchableUsers.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : users.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <p>
                    {search.trim()
                      ? buildSentence(t, "no", "users", "found")
                      : buildSentence(t, "no", "users", "available", "to", "add")}
                  </p>
                </div>
              ) : (
                users.map((user: UserDto) => {
                  const firstName = user.firstName || "";
                  const lastName = user.lastName || "";
                  const fullName = `${firstName} ${lastName}`.trim() || user.email || "User";
                  const initials = `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";
                  const isAlreadyAdded = existingUserIds.has(user.id);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{fullName}</p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      {!isAlreadyAdded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-primary hover:text-background transition-colors"
                          onClick={() => handleAddUser(user.id, fullName)}
                          disabled={isSubmitting}
                          title={buildSentence(t, "add", "user")}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </AppDialog>
      </DialogContent>
    </Dialog>
  );
});

export { ChatAddUsersModal };
