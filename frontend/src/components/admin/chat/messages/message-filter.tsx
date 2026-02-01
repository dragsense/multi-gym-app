import { useId, useTransition, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useInput } from "@/hooks/use-input";
import type { TListHandlerStore } from "@/stores";
import type { ChatMessageDto, ChatMessageListDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { TFieldConfigObject } from "@/@types/form/field-config.type";
import { buildSentence } from "@/locales/translations";
import { useI18n } from "@/hooks/use-i18n";

interface MessageFilterProps {
  store: TListHandlerStore<ChatMessageDto, ChatMessageListDto, any>;
}

export function MessageFilter({ store }: MessageFilterProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const { t } = useI18n();  

  const filteredFields = store.getState().filteredFields;
  const filters = store((state) => state.filters);
  const setFilters = store.getState().setFilters;


  const fields = useMemo(() => {
    return {
      ...filteredFields,
      search: {
        ...filteredFields.search,
        label: '',
        placeholder: buildSentence(t, "search", "messages"),
      },
    }
  }, [filteredFields]);

  const inputs = useInput<ChatMessageListDto>({
    fields: fields as TFieldConfigObject<ChatMessageListDto>,
  });


  const hasActiveFilters = useMemo(() => Object.keys(filters).length > 0, [filters]);

  const handleClearFilters = () => {
    startTransition(() => setFilters({}));
  };

  return (
    <div className="p-2 border-b border-border flex items-end gap-2 flex-wrap" data-component-id={componentId}>
      {inputs.search}
      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearFilters} className="hidden lg:flex">
          <XIcon className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

