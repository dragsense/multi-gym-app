// React
import { useId, useState, useEffect } from "react";

// Types
import type { IMember } from "@shared/interfaces/member.interface";
import type { ChatDto, CreateChatDto } from "@shared/dtos";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { MessageSquare } from "lucide-react";
import { ChatMessagesHandler } from "@/page-components/chat/chat-messages-handler";
import { createChat } from "@/services/chat.api";
import { chatService } from "@/services/socket-services/chat.service";

interface IMemberCommunicationsTabProps {
  member: IMember;
}

const STORE_KEY = "member-communications-chat";

export function MemberCommunicationsTab({ member }: IMemberCommunicationsTabProps) {
  const componentId = useId();
  const [selectedChat, setSelectedChat] = useState<ChatDto | null>(null);

  useEffect(() => {
    if (!member?.user?.id) {
      return;
    }

    // Find or create chat with member's user ID
    const findOrCreateChat = async () => {
      try {
        const chatData: CreateChatDto = {
          isGroup: false,
          participantIds: [{ id: member.user.id }] as any,
        };
        
        const result = await createChat(chatData);
        // The backend returns { message: string, chat: ChatDto } for createOrGetChat
        const chat = (result as any).chat || result;
        setSelectedChat(chat);
        chatService.joinChat(chat.id).catch((error) => {
          console.error("Failed to join chat:", error);
        });
      } catch (error) {
        console.error("Failed to find or create chat:", error);
      }
    };

    findOrCreateChat();
  }, [member?.user?.id]);

 

  return (
    <div data-component-id={componentId}>
      <AppCard
        header={
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Communications</h3>
          </div>
        }
      >
        <ChatMessagesHandler
          selectedChat={selectedChat}
          storeKey={STORE_KEY}
        />
      </AppCard>
    </div>
  );
}

