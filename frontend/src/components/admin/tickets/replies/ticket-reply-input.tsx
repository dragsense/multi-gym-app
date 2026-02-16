import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

interface TicketReplyInputProps {
  onSend: (message: string, isInternal: boolean) => void;
}

export function TicketReplyInput({ onSend }: TicketReplyInputProps) {
  const componentId = useId();
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const { t } = useI18n();

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(message.trim(), isInternal);
    setMessage("");
    setIsInternal(false);
  };

  return (
    <div className="border-t border-border p-4 bg-card" data-component-id={componentId}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="space-y-3"
      >
        <Textarea
          placeholder={buildSentence(t, "type", "your", "reply", "here")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="flex items-center justify-end">

          <Button type="submit" disabled={!message.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {buildSentence(t, "send", "reply")}
          </Button>
        </div>
      </form>
    </div>
  );
}
