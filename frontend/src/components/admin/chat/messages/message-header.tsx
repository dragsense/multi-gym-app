import { useId, useState } from "react";
import { Trash2, MoreVertical, Users, UserPlus, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageFilter } from "./message-filter";
import { useAuthUser } from "@/hooks/use-auth-user";
import type { ChatDto, ChatMessageListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { TListHandlerStore } from "@/stores";
import type { ChatMessageDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IMessageListExtraProps } from "./message-list";
import { useShallow } from "zustand/shallow";

interface MessageHeaderProps {
  store: TListHandlerStore<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>;
  chatStore: TListHandlerStore<ChatDto, any, any> | null;
}

export function MessageHeader({
  store,
  chatStore,
}: MessageHeaderProps) {
  const componentId = useId();
  const { user } = useAuthUser();

  const { extra, setAction } = store(
    useShallow((state) => ({
      extra: state.extra,
      setAction: state.setAction,
    }))
  );

  const chat = extra?.selectedChat as ChatDto | undefined;
  const chatSetAction = chatStore ? chatStore((state) => state.setAction) : null;

  if (!chat) {
    return null;
  }



  const getChatUsers = (chat: ChatDto) => {
    const chatUsers = (chat as any).chatUsers;
    if (chatUsers && chatUsers.length > 0) {
      return chatUsers.filter((cu: any) => cu.user.id !== user?.id);
    }
    return [];
  };

  const getChatName = () => {
    if (chat.name) return chat.name;
    const chatUsers = getChatUsers(chat);
    if (chatUsers && chatUsers.length > 0) {
      // Get at least 2 users and combine their names with comma
      const userNames = chatUsers
        .slice(0, 3) // Get first 2 users
        .map((cu: any) => {
          const user = cu.user;
          if (!user) return null;
          const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
          return fullName || user.email || "User";
        })
        .filter((name: string | null) => name !== null);

      if (userNames.length > 0) {
        const namesString = userNames.join(", ");
        if (namesString.length > 50) {
          return namesString.substring(0, 50) + "...";
        }
        return namesString;
      }
    }
    return "Chat";
  };

  const getChatParticipantsCount = () => {
    return (chat as any).chatUsers?.filter((cu: any) => !cu.deletedAt)?.length || 0;
  };

  return (
    <div data-component-id={componentId}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{getChatName()[0]?.toUpperCase() || "C"}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{getChatName()}</h3>
            <p className="text-sm text-muted-foreground">
              {getChatParticipantsCount()} participants
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {chatSetAction && (
                <>
                  <DropdownMenuItem onClick={() => chatSetAction("showParticipants", { chatId: chat.id })}>
                    <Users className="h-4 w-4 mr-2" />
                    View Participants
                  </DropdownMenuItem>
                  {chat.isGroup && (
                    <>
                      <DropdownMenuItem onClick={() => chatSetAction("addUsersToChat", { chatId: chat.id })}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Users
                      </DropdownMenuItem>
                      
                    </>
                  )}
                </>
              )}
              <DropdownMenuItem onClick={() => setAction("clearChat", { chatId: chat.id })}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

