import { useId } from "react";
import { useShallow } from "zustand/shallow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { List } from "@/components/list-ui/list";
import { ChatHeader } from "./chat-header";
import { chatItemViews } from "./chat-item-views";
import type { TListHandlerStore } from "@/stores";
import type { TListHandlerComponentProps } from "@/@types/handler-types";
import type { ChatDto } from "@shared/dtos/chat-dtos/chat.dto";
import { useAuthUser } from "@/hooks/use-auth-user";

export interface IChatsExtraProps {
  selectedChat?: ChatDto;
}

interface IChatListProps
  extends TListHandlerComponentProps<TListHandlerStore<ChatDto, any, IChatsExtraProps>> { }

export default function ChatList({ storeKey, store }: IChatListProps) {
  const componentId = useId();

  const { listItem } = chatItemViews();

  if (!store) {
    return <div>List store "{storeKey}" not found.</div>;
  }

  const { response, setResponse, extra, setAction, setExtra } = store(
    useShallow((state) => ({
      response: state.response,
      setResponse: state.setResponse,
      extra: state.extra,
      setAction: state.setAction,
      setExtra: state.setExtra,
    }))
  );

  const selectedChat = extra?.selectedChat;
  const { user } = useAuthUser();

  const handleSelectChat = (chat: ChatDto) => {
    setExtra("selectedChat", chat);
  };

  const handleDelete = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAction("delete", chatId);
  };

  const handleAddUsers = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAction("addUsersToChat", { chatId });
  };

  const handleShowParticipants = (chat: ChatDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setAction("showParticipants", { chatId: chat.id });
  };

  const handleEdit = (chat: ChatDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setAction("createOrUpdate", { chatId: chat.id, isGroup: chat.isGroup ?? false });
  };


  return (
    <div data-component-id={componentId} className="flex flex-col h-full">
      <ChatHeader store={store} />
      <div className="h-[calc(100vh-330px)] overflow-y-auto">
        <ScrollArea className="flex-1">
          <List
            listStore={store as any}
            renderItem={(chat: ChatDto) =>
              listItem(
                chat,
                selectedChat?.id === chat.id,
                handleSelectChat,
                handleDelete,
                handleAddUsers,
                handleShowParticipants,
                handleEdit
              )
            }
            getItemKey={(chat: ChatDto, index: number) => chat.id}
            showPagination={false}
            showLoadMore={true}
            emptyMessage="No chats found"
            rowClassName="flex-col gap-2"
          />
        </ScrollArea>
      </div>

    </div >
  );
}
