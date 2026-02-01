import { useQueryClient } from "@tanstack/react-query";

// Types
import { ChatListDto, type ChatDto } from "@shared/dtos/chat-dtos/chat.dto";

// Handlers
import { ListHandler } from "@/handlers";

// Page Components
import { Chats, type IChatsExtraProps, ChatForm } from "@/page-components/chat";
import ChatAddUsers from "@/page-components/chat/chat-add-users";
import ChatParticipants from "@/page-components/chat/chat-participants";

// Services
import { fetchChats, deleteChat } from "@/services/chat.api";

// Layouts
import { PageInnerLayout } from "@/layouts";
import { useRegisteredStore, type TListHandlerStore } from "@/stores";
import { useShallow } from "zustand/shallow";

export default function ChatPage() {
  const queryClient = useQueryClient();
  const CHAT_STORE_KEY = "chat";

  return (
    <PageInnerLayout Header={<Header />}>
      <ListHandler<ChatDto, any, IChatsExtraProps>
        queryFn={fetchChats}
        deleteFn={deleteChat}
        dto={ChatListDto}
        initialParams={{
          limit: 20,
          page: 1,
          sortBy: "updatedAt",
          sortOrder: "DESC",
        }}
        ListComponent={Chats}
        storeKey={CHAT_STORE_KEY}
        listProps={{
          selectedChat: undefined,
        }}
        onDeleteSuccess={(store) => {
          queryClient.invalidateQueries({
            queryKey: [CHAT_STORE_KEY + "-list"],
          })

          if (store) {
            store.getState().setExtra("selectedChat", undefined);
          }
        }}
        actionComponents={[
          {
            action: "createOrUpdate",
            comp: ChatForm,
          },
          {
            action: "addUsersToChat",
            comp: ChatAddUsers,
          },
          {
            action: "showParticipants",
            comp: ChatParticipants,
          },

        ]}
      />
    </PageInnerLayout>
  );
}

const Header = () => null;

