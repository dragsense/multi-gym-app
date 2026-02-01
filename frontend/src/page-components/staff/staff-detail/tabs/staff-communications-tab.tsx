// React
import { useId, useState, useEffect } from "react";

// Types
import type { ChatDto, CreateChatDto } from "@shared/dtos";

// Components
import { AppCard } from "@/components/layout-ui/app-card";
import { MessageSquare } from "lucide-react";
import { ChatMessagesHandler } from "@/page-components/chat/chat-messages-handler";
import { createChat } from "@/services/chat.api";
import { chatService } from "@/services/socket-services/chat.service";
import type { IStaff } from "@shared/interfaces/staff.interface";

interface IStaffCommunicationsTabProps {
  staff: IStaff;
}

const STORE_KEY = "staff-communications-chat";

export function StaffCommunicationsTab({ staff }: IStaffCommunicationsTabProps) {
  const componentId = useId();
  const [selectedChat, setSelectedChat] = useState<ChatDto | null>(null);

  useEffect(() => {
    if (!staff?.user?.id) {
      return;
    }

    // Find or create chat with staff's user ID
    const findOrCreateChat = async () => {
      try {
        const chatData: CreateChatDto = {
          isGroup: false,
          participantIds: [{ id: staff.user.id }] as any,
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
  }, [staff?.user?.id]);

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

