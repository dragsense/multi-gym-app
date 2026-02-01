import { useMemo } from "react";
import { ListHandler } from "@/handlers";
import { ChatDto, ChatMessageDto, ChatMessageListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IMessageListExtraProps } from "@/components/admin/chat/messages/message-list";
import type { IListQueryParams } from "@shared/interfaces/api/param.interface";
import type { IPaginatedResponse } from "@shared/interfaces/api/response.interface";
import { fetchChatMessages } from "@/services/chat.api";
import MessageSend from "./message-send";
import MessageDelete from "./message-delete";
import MessageClearChat from "./message-clear-chat";
import { MessageList } from "@/components/admin/chat/messages/message-list";
import { EmptyChat } from "@/components/admin/chat";

interface IChatMessagesHandlerProps {
  selectedChat: ChatDto | null;
  storeKey: string;
}

export function ChatMessagesHandler({
  selectedChat,
  storeKey,
}: IChatMessagesHandlerProps) {
  // Memoize queryFn to prevent unnecessary re-renders
  const queryFn = useMemo(
    () => (params: IListQueryParams): Promise<IPaginatedResponse<ChatMessageDto>> => {
      if (!selectedChat?.id) {
        return Promise.resolve({
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          lastPage: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
      return fetchChatMessages(selectedChat.id, params);
    },
    [selectedChat?.id]
  );

  // Don't render if no chat is selected
  if (!selectedChat) {
    return <EmptyChat />;
  }

  return (
    <ListHandler<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>
      queryFn={queryFn}
      ListComponent={MessageList}
      storeKey={storeKey + "-messages-" + selectedChat.id}
      initialParams={{
        sortBy: "createdAt",
        sortOrder: "ASC",
      }}
      listProps={{
        selectedChat: selectedChat,
        chatStoreKey: storeKey + "-list",
      }}
      dto={ChatMessageListDto}
      actionComponents={[
        {
          action: "sendMessage",
          comp: MessageSend,
        },
        {
          action: "deleteMessage",
          comp: MessageDelete,
        },
        {
          action: "clearChat",
          comp: MessageClearChat,
        },
      ]}
    />
  );
}

