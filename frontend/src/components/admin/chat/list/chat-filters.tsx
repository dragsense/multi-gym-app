import { useId, useTransition, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { Button } from "@/components/ui/button";
import { XIcon, MoreVertical, Filter } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInput } from "@/hooks/use-input";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";
import type { TListHandlerStore } from "@/stores";
import type { ChatDto, ChatListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";

interface ChatFiltersProps {
  store: TListHandlerStore<ChatDto, ChatListDto, any>;
}

export function ChatFilters({ store }: ChatFiltersProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();

  const filteredFields = store.getState().filteredFields;


  const fields = useMemo(() => {
    return {
      ...filteredFields,
      search: {
        ...filteredFields.search,
        label: '',
        placeholder: buildSentence(t, "search", "chats"),
      },
      level: {
        ...filteredFields.level,
        label: buildSentence(t, "level", "chats"),
        placeholder: buildSentence(t, "select", "level"),
      },
    
    }
  }, [filteredFields]);

  const filters = store((state) => state.filters);
  const setFilters = store.getState().setFilters;

  const inputs = useInput<ChatListDto>({
    fields: fields as TFieldConfigObject<ChatListDto>,
  });

  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="p-4 border-b border-border" data-component-id={componentId}>
      <div className="flex-1 flex items-end gap-2 flex-wrap">
        {inputs.search}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2 space-y-3">
              <div className="space-y-1">
                {inputs.level}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {hasActiveFilters && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
                  <XIcon className="h-4 w-4 mr-2" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{buildSentence(t, "clear", "filters")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

