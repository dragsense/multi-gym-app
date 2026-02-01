import { useId } from "react";
import { useShallow } from "zustand/shallow";
import { MessageHeader } from "./message-header";
import { MessagesContainer } from "./messages-container";
import type { ChatDto, ChatMessageDto, ChatMessageListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { TListHandlerStore } from "@/stores";
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import { ChatInput } from "../components/chat-input";
import { useRegisteredStore } from "@/stores";

export interface IMessageListExtraProps {
  selectedChat: ChatDto;
  chatStoreKey: string;
}

interface MessageListProps
  extends TListHandlerComponentProps<TListHandlerStore<ChatMessageDto, ChatMessageListDto, IMessageListExtraProps>> { }

export function MessageList({ storeKey, store }: MessageListProps) {
  const componentId = useId();

  if (!store) {
    return null;
  }

  const { extra, setAction } = store(
    useShallow((state) => ({
      extra: state.extra,
      setAction: state.setAction,
    }))
  );

  const chat = extra?.selectedChat as ChatDto | undefined;
  const chatStoreKey = extra?.chatStoreKey as string | undefined;


  // Get chat store to access chat actions
  const chatStore = chatStoreKey ? useRegisteredStore<TListHandlerStore<ChatDto, any, any>>(chatStoreKey) : null;

  if (!chat) {
    return null;
  }

  const handleDelete = (messageId: string, deleteFor: "everyone" | "self") => {
    setAction("deleteMessage", { messageId, deleteFor });
  };

  const handleSend = (message: string, file?: File) => {
    setAction("sendMessage", { message, file });
  };

  return (
    <div data-component-id={componentId} className="flex flex-col">
      <MessageHeader store={store} chatStore={chatStore} />
      <MessagesContainer store={store} onDelete={handleDelete} />
      <div className="flex-shrink-0">
        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}

