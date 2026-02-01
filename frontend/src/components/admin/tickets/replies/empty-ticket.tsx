import { MessageSquare } from "lucide-react";
import { useI18n } from "@/hooks/use-i18n";
import { buildSentence } from "@/locales/translations";

export function EmptyTicket() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {buildSentence(t, "no", "ticket", "selected")}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {buildSentence(t, "select", "a", "ticket", "from", "the", "list", "to", "view", "details", "and", "replies")}
      </p>
    </div>
  );
}
