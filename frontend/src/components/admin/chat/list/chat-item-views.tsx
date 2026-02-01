import { Trash, UserPlus, UserMinus, Pencil, Users, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateTime } from "luxon";
import type { ChatDto } from "@shared/dtos/chat-dtos/chat.dto";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export function chatItemViews() {
  const { user } = useAuthUser();
  const { t } = useI18n();

  const getCurrentChatUser = (chat: ChatDto) => {
    const chatUsers = (chat as any).chatUsers;
    if (chatUsers && chatUsers.length > 0) {
      return chatUsers.find((cu: any) => cu.user.id === user?.id);
    }
    return null;
  };

  const getChatUsers = (chat: ChatDto) => {
    const chatUsers = (chat as any).chatUsers;
    if (chatUsers && chatUsers.length > 0) {
      return chatUsers.filter((cu: any) => cu.user.id !== user?.id);
    }
    return [];
  };

  const getChatName = (chat: ChatDto) => {
    if (chat.name) return chat.name;
    const chatUsers = getChatUsers(chat);
    if (chatUsers && chatUsers.length > 0) {
      // Get at least 2 users and combine their names with comma
      const userNames = chatUsers
        .slice(0, Math.min(chatUsers.length, 3)) // Get up to 3 users
        .map((cu: any) => {
          const user = cu.user;
          if (!user) return null;
          const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
          return fullName || user.email || "User";
        })
        .filter((name: string | null) => name !== null);

      if (userNames.length > 0) {
        const namesString = userNames.join(", ");
        if (namesString.length > 15) {
          return namesString.substring(0, 15) + "...";
        }
        return namesString;
      }
    }
    return "Chat";
  };

  const getChatAvatar = (chat: ChatDto) => {
    if (chat.name) {
      // Group chat - use first letter of chat name
      return chat.name[0]?.toUpperCase() || "C";
    }
    const chatUsers = getChatUsers(chat);
    if (chatUsers && chatUsers.length > 0) {
      const user = chatUsers[0].user;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "U";
    }
    return "C";
  };


  const getIsAdmin = (chat: ChatDto) => {
    const currentChatUser = getCurrentChatUser(chat);
    return currentChatUser?.isAdmin || false;
  };

  const getUnreadCount = (chat: ChatDto) => {
    const currentChatUser = getCurrentChatUser(chat);
    return currentChatUser?.unreadCount || 0;
  };


  const listItem = (
    chat: ChatDto,
    isSelected: boolean,
    handleSelectChat: (chat: ChatDto) => void,
    onDelete: (chatId: string, e: React.MouseEvent) => void,
    onAddUsers: (chatId: string, e: React.MouseEvent) => void,
    onShowParticipants: (chat: ChatDto, e: React.MouseEvent) => void,
    onEdit: (chat: ChatDto, e: React.MouseEvent) => void
  ) => {

    const isAdmin = getIsAdmin(chat);
    const isGroupChat = chat.isGroup ?? false;
    const unreadCount = getUnreadCount(chat);

    return (
      <div
        onClick={() => handleSelectChat(chat)}
        className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${isSelected ? "bg-accent" : ""
          }`}
      >
        <div className="flex items-start gap-3">
          <Avatar>
            <AvatarFallback>{getChatAvatar(chat)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{getChatName(chat)}</span>
                {unreadCount && unreadCount > 0 ? (
                  <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                ) : null}
                {chat.lastMessage && (
                  <span className="text-xs text-muted-foreground">
                    {DateTime.fromISO(chat.lastMessage.createdAt).toRelative()}
                  </span>
                )}
              </div>
            </div>
            {chat.lastMessage && (
              <p className="text-sm text-muted-foreground truncate">
                {chat.lastMessage.isDeleted &&
                  chat.lastMessage.deletedFor === "everyone"
                  ? "This message is deleted by user"
                  : chat.lastMessage.message}
              </p>

            )}
            {/* Show other participants */}


          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {isGroupChat && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onShowParticipants(chat, e);
                  }}>
                    <Users className="h-4 w-4 mr-2" />
                    {buildSentence(t, "view", "participants")}
                  </DropdownMenuItem>
                )}
                {isGroupChat && isAdmin && (
                  <>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onEdit(chat, e);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      {buildSentence(t, "edit", "chat", "name")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      onAddUsers(chat.id, e);
                    }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {buildSentence(t, "add", "users")}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(chat.id, e);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  {buildSentence(t, "delete", "chat")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return {
    listItem,
    getChatName,
    getChatAvatar,
    getIsAdmin,
  };
}

