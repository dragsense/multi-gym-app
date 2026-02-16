import { useId, useTransition } from "react";
import { useShallow } from "zustand/shallow";
import {  MessageSquare, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import { ChatFilters } from "./chat-filters";
import type { TListHandlerStore } from "@/stores";
import type { ChatDto, ChatListDto } from "@shared/dtos/chat-dtos/chat.dto";

interface ChatHeaderProps {
  store: TListHandlerStore<ChatDto, ChatListDto, any>;
}

export function ChatHeader({ store }: ChatHeaderProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const setAction = store(
    useShallow((state) => state.setAction)
  );

  const handleCreateSingleChat = () => {
    startTransition(() => {
      setAction("createOrUpdate", { isGroup: false });
    });
  };

  const handleCreateGroupChat = () => {
    startTransition(() => {
      setAction("createOrUpdate", { isGroup: true });
    });
  };

  return (
    <div data-component-id={componentId} className="flex justify-between items-center gap-2 flex-wrap">
      <ChatFilters store={store} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-component-id={componentId}>
          <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCreateSingleChat}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {buildSentence(t, "single", "chat")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCreateGroupChat}>
            <Users className="h-4 w-4 mr-2" />
            {buildSentence(t, "group", "chat")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

