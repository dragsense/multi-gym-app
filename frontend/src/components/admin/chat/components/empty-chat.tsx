import { MessageSquare } from "lucide-react";

export function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
      <p className="text-lg font-medium">Select a chat to start messaging</p>
    </div>
  );
}

