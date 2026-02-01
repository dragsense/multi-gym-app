import { useId, useEffect, useCallback, useRef } from "react";
import { useShallow } from "zustand/shallow";
import { ChatList as ChatListComponent, EmptyChat } from "@/components/admin/chat";
import type { TListHandlerStore } from "@/stores";
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatDto, ChatMessageDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { IChatsExtraProps } from "@/components/admin/chat/list/chat-list";
import { ChatMessagesHandler } from "./chat-messages-handler";
import { resetUnreadCount, fetchChat } from "@/services/chat.api";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { useAuthUser } from "@/hooks/use-auth-user";

export type { IChatsExtraProps };


interface IChatsPageProps
  extends TListHandlerComponentProps<TListHandlerStore<ChatDto, any, IChatsExtraProps>> { }

export function Chats({ storeKey, store }: IChatsPageProps) {
  const componentId = useId();
  const { user } = useAuthUser();

  if (!store) {
    return <div>List store "{storeKey}" not found.</div>;
  }

  const { extra, response, setResponse } = store(
    useShallow((state) => ({
      extra: state.extra,
      response: state.response,
      setResponse: state.setResponse,
    }))
  );

  const selectedChat = extra?.selectedChat;
  const selectedChatIdRef = useRef<string | undefined>(selectedChat?.id);

  // Update ref when selectedChat changes
  useEffect(() => {
    selectedChatIdRef.current = selectedChat?.id;
  }, [selectedChat?.id]);


  const handleResetUnreadCount = useCallback(() => {
    if (selectedChat?.id) {
      resetUnreadCount(selectedChat.id)
        .then(() => {
          const currentChatUser = selectedChat?.chatUsers?.find((chatUser) => chatUser.user?.id === user?.id);
          if (currentChatUser) {
            currentChatUser.unreadCount = 0;
          }

          setResponse([...response]);
        }).catch((error) => {
          console.error("Failed to reset unread count:", error);
        });
    }
  }, [selectedChat?.id, response, setResponse]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (selectedChat?.id) {
      handleResetUnreadCount();
    }
  }, [selectedChat?.id]);

  // Handle new chat from socket
  const handleNewChat = useCallback((newChat: ChatDto) => {
    // Get current response from store to avoid stale closure and duplicates
    if (response && !response.some((c) => c.id === newChat.id)) {
      // Add new chat to top
      setResponse([newChat, ...response]);
    }
  }, [response, setResponse]);

  // Handle new unread count from socket
  const handleNewUnreadCount = useCallback((data: { chatId: string, unreadCount: number, lastMessage: ChatMessageDto }) => {

    // Get current response from store to avoid stale closure
    if (response) {
      const chatIndex = response.findIndex((chat) => chat.id === data.chatId);
      if (chatIndex !== -1) {
        const currentChatUser = response[chatIndex].chatUsers?.find((chatUser) => chatUser.user?.id === user?.id);

        if (currentChatUser) {
          const isCurrentChat = selectedChatIdRef.current === data.chatId;
          currentChatUser.unreadCount = isCurrentChat ? 0 : data.unreadCount;

          if (isCurrentChat) {
            resetUnreadCount(selectedChat.id).then(() => {
              console.log("Unread count reset successfully");
            }).catch((error) => {
              console.error("Failed to reset unread count:", error);
            });
          }
        }
        const updatedChat = { ...response[chatIndex], lastMessage: data.lastMessage };
        const filteredResponse = response.filter((chat) => chat.id !== updatedChat.id);
        setResponse([updatedChat, ...filteredResponse]);
        return;
      }
    }

    // If chat not found in response, fetch from backend
    fetchChat(data.chatId)
      .then((chat) => {
        // Get current response from store to avoid stale closure
        if (chat && response && !response.some((c) => c.id === chat.id)) {
          // Add chat with updated unread count to top
          setResponse([{ ...chat }, ...response]);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch chat:", error);
      });
  }, [response, setResponse]);

  const handleNewMessage = useCallback((newMessage: ChatMessageDto) => {
    if (response && user?.id === newMessage.senderId) {
      const chatIndex = response.findIndex((chat) => chat.id === newMessage.chatId);
      if (chatIndex !== -1) {
        const currentChat = response[chatIndex];
        currentChat.lastMessage = newMessage;
        const filteredResponse = response.filter((chat) => chat.id !== currentChat.id);
        setResponse([currentChat, ...filteredResponse]);
      }
    }
  }, [response, setResponse]);

  useChatSocket(selectedChat?.id || null, {
    onNewChat: handleNewChat,
    newUnreadCount: handleNewUnreadCount,
    onNewMessage: handleNewMessage,
  });

  return (
    <div data-component-id={componentId} className="flex w-full overflow-hidden">
      <div className="border-r bg-card border rounded-xl shadow-sm border-border pr-1 max-w-[400px]">
        <ChatListComponent
          storeKey={storeKey}
          store={store}
        />
      </div>
      <div className="flex-1 flex flex-col">
        <ChatMessagesHandler
          key={selectedChat?.id || "no-chat"}
          selectedChat={selectedChat}
          storeKey={storeKey}
        />
      </div>
    </div>
  );
}
