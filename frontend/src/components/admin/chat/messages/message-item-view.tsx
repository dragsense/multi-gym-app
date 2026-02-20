import { useId, type ReactNode } from "react";
import { MoreVertical, Paperclip } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateTime } from "luxon";
import type { ChatMessageDto } from "@shared/dtos/chat-dtos/chat.dto";
import { useAuthUser } from "@/hooks/use-auth-user";

interface MessageItemViewProps {
  message: ChatMessageDto;
  onDelete: (messageId: string, deleteFor: "everyone" | "self") => void;
  searchQuery?: string;
  isHighlighted?: boolean;
}

export function MessageItemView({ message, onDelete, searchQuery = "", isHighlighted = false }: MessageItemViewProps) {
  const componentId = useId();
  const { user } = useAuthUser();
  const isOwn = message.senderId === user?.id;
  const isDeleted = message.isDeleted && message.deletedFor === "everyone";
  const isSystemMessage = message.messageType === "system";

  // Highlight search query in message text
  const highlightText = (text: string, query: string): ReactNode => {
    if (!query.trim() || !text) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Check if this part matches the query (case-insensitive)
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 px-0">
            {part}
          </mark>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderAttachment = () => {
    if (!message.attachment) return null;

    const attachment = message.attachment as any;

    if (message.messageType === "image") {
      return (
        <img
          src={attachment.url}
          alt={attachment.name || attachment.originalName || "Image"}
          className="max-w-xs rounded-lg mt-2"
          crossOrigin="anonymous"
        />
      );
    }

    if (message.messageType === "audio") {
      return (
        <audio
          controls
          className="mt-2"
          src={attachment.url}
        />
      );
    }

    return (
      <a
        href={attachment.url}
        download={attachment.name || attachment.originalName || "file"}
        className="mt-2 flex items-center gap-2 text-blue-500 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Paperclip className="h-4 w-4" />
        {attachment.name || attachment.originalName || "Document"}
      </a>
    );
  };

  // Render system messages (userAdd/userRemove) centered
  if (isSystemMessage) {
    return (
      <div
        data-component-id={componentId}
        className="flex justify-center items-center my-2"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full">
          <span className="text-xs text-muted-foreground">
            {message.message}
          </span>
          <span className="text-xs text-muted-foreground">
            {DateTime.fromISO(message.createdAt).toRelative()}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      data-component-id={componentId}
      className={`flex gap-3 ${isOwn ? "justify-end" : "justify-start"}`}
    >

      <div className={`flex flex-col max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? "flex-row-reverse" : ""}`}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback>
              {message.sender?.firstName?.[0] || "U"}
              {message.sender?.lastName?.[0] || ""}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">
            {isOwn
              ? "You"
              : `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`.trim() ||
              "User"}
          </span>
          <span className="text-xs text-muted-foreground">
            {DateTime.fromISO(message.createdAt).toRelative()}
          </span>
        </div>
        <div className={`flex items-center gap-2 ${!isOwn ? "flex-row-reverse" : "flex-row"}`}>
          <div
            className={`inline-block p-3 rounded-lg ${isOwn
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-muted rounded-bl-none"
              }`}
          >

            {isDeleted ? (
              <span className="italic text-muted-foreground">
                {isOwn ? "This message is deleted by you" : "This message is deleted by user"}
              </span>
            ) : (
              <>
                {message.message && (
                  <p className={`mb-0 whitespace-pre-wrap break-words ${isHighlighted ? "bg-yellow-200 dark:bg-yellow-800" : ""}`}>
                    {searchQuery ? highlightText(message.message, searchQuery) : message.message}
                  </p>
                )}
                {renderAttachment()}
              </>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-1 h-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>

              <>
                {isOwn && (<DropdownMenuItem
                  onClick={() => onDelete(message.id, "everyone")}
                >
                  Delete for everyone
                </DropdownMenuItem>)}
                <DropdownMenuItem onClick={() => onDelete(message.id, "self")}>
                  Delete for me
                </DropdownMenuItem>
              </>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

    </div>
  );
}

