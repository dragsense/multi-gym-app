import { useId, useRef, useEffect, useState, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, X, ChevronUp, ChevronDown } from "lucide-react";
import { MessageItemView } from "./message-item-view";
import type { ChatDto, ChatMessageDto } from "@shared/dtos/chat-dtos/chat.dto";
import type { TListHandlerStore } from "@/stores";
import { useShallow } from "zustand/shallow";
import { useChatSocket } from "@/hooks/use-chat-socket";
import { EmptyChat } from "../components/empty-chat";
import { useAuthUser } from "@/hooks/use-auth-user";

interface MessagesContainerProps {
  store: TListHandlerStore<ChatMessageDto, any, any>;
  onDelete: (messageId: string, deleteFor: "everyone" | "self") => void;
}

export function MessagesContainer({ store, onDelete }: MessagesContainerProps) {
  const componentId = useId();
  const { user } = useAuthUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);
  const [accumulatedMessages, setAccumulatedMessages] = useState<ChatMessageDto[]>([]);
  const previousPageRef = useRef<number>(1);
  const previousMessagesLengthRef = useRef<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  if (!store) {
    return null;
  }

  const { response: newMessages, pagination, isLoading, setPagination, setResponse } = store(
    useShallow((state) => ({
      response: state.response,
      pagination: state.pagination,
      isLoading: state.isLoading,
      setPagination: state.setPagination,
      setResponse: state.setResponse,
    }))
  );

  useChatSocket(null, {
    onNewMessage: (newMessage: ChatMessageDto) => {
      if (newMessages && !newMessages.some((m: ChatMessageDto) => m.id === newMessage.id)) {
        setResponse([...newMessages, newMessage]);
      }
    },
    onMessageDeleted: (data) => {
      if (newMessages) {
        if (data.deleteFor === "everyone") {
          setResponse(
            newMessages?.map((m: ChatMessageDto) =>
              m.id === data.messageId
                ? {
                  ...m,
                  isDeleted: true,
                  deletedBy: data.deletedBy,
                  deletedFor: "everyone",
                  message: "This message is deleted by user",
                }
                : m
            ) || []
          );
        } else {
          if(data.deletedBy === user?.id) {
            setResponse(
              newMessages?.filter((m: ChatMessageDto) => m.id !== data.messageId) || []
            );
          }
        }
      }
    },
    onChatCleared: () => {
      if (newMessages) {
        setResponse([]);
      }
    },
  });

  // Accumulate messages - prepend new ones when loading more (page > 1)
  useEffect(() => {
    if (!newMessages) return;

    const currentPage = pagination?.page || 1;
    const previousPage = previousPageRef.current;

    if (currentPage === 1) {
      // First load or reset - replace all messages
      setAccumulatedMessages(newMessages);
      previousPageRef.current = 1;
    } else if (currentPage > previousPage) {
      // Loading more - prepend new messages (older messages come first in response)
      setAccumulatedMessages((prev) => {
        // Filter out duplicates
        const existingIds = new Set(prev.map((m) => m.id));
        const uniqueNewMessages = newMessages.filter((m) => !existingIds.has(m.id));
        // Prepend older messages (they come first in the response)
        return [...uniqueNewMessages, ...prev];
      });
      previousPageRef.current = currentPage;
    }
  }, [newMessages, pagination?.page]);

  // Auto scroll to bottom on new messages (only if user was at bottom)
  useEffect(() => {
    const currentLength = accumulatedMessages?.length || 0;
    const previousLength = previousMessagesLengthRef.current;

    // Only auto-scroll if new messages were added (not loaded from top)
    if (shouldScrollToBottom && messagesEndRef.current && currentLength > previousLength) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }

    previousMessagesLengthRef.current = currentLength;
  }, [accumulatedMessages?.length, shouldScrollToBottom]);

  // Handle scroll to detect if user is at top for load more
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;

    // Check if scrolled to top (within 100px)
    if (scrollTop < 100 && pagination?.hasNextPage && !isLoading) {
      setShouldScrollToBottom(false);
      // Load more messages
      setPagination({ page: (pagination.page || 1) + 1 });
    }

    // Check if user is near bottom
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight - 200) {
      setShouldScrollToBottom(true);
    } else {
      setShouldScrollToBottom(false);
    }
  }, [pagination, isLoading, setPagination]);


  const handleLoadMore = () => {
    if (pagination?.hasNextPage && !isLoading) {
      setShouldScrollToBottom(false);
      setPagination({ page: (pagination.page || 1) + 1 });
    }
  };

  const hasMore = pagination?.hasNextPage || false;
  const allMessages = accumulatedMessages.length > 0 ? accumulatedMessages : (newMessages || []);

  // Get search result indices (matching messages in allMessages)
  const searchResultIndices = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allMessages
      .map((message, index) => {
        if (message.isDeleted) return null;
        const messageText = message.message?.toLowerCase() || "";
        const senderName = `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`.toLowerCase();
        const matches = messageText.includes(query) || senderName.includes(query);
        return matches ? index : null;
      })
      .filter((index): index is number => index !== null);
  }, [allMessages, searchQuery]);

  // Check if a message matches the search query
  const messageMatchesSearch = useCallback((message: ChatMessageDto, query: string): boolean => {
    if (!query.trim() || message.isDeleted) return false;
    const queryLower = query.toLowerCase();
    const messageText = message.message?.toLowerCase() || "";
    const senderName = `${message.sender?.firstName || ""} ${message.sender?.lastName || ""}`.toLowerCase();
    return messageText.includes(queryLower) || senderName.includes(queryLower);
  }, []);

  // Scroll to current search result
  useEffect(() => {
    if (searchQuery.trim() && searchResultIndices.length > 0 && currentSearchIndex >= 0 && currentSearchIndex < searchResultIndices.length) {
      const messageIndex = searchResultIndices[currentSearchIndex];
      const message = allMessages[messageIndex];
      if (message?.id) {
        const messageElement = messageRefs.current.get(message.id);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  }, [currentSearchIndex, searchQuery, allMessages, searchResultIndices]);

  // Reset search index when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setCurrentSearchIndex(0);
    } else {
      setCurrentSearchIndex(-1);
    }
  }, [searchQuery]);

  const handleNextSearch = () => {
    if (searchResultIndices.length > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResultIndices.length);
    }
  };

  const handlePreviousSearch = () => {
    if (searchResultIndices.length > 0) {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResultIndices.length) % searchResultIndices.length);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentSearchIndex(-1);
  };

  // Display all messages (no filtering)
  const displayMessages = allMessages;

  return (
    <div className="flex flex-col">
      {/* Search Bar */}
      <div className="p-2 border-b border-border flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchQuery.trim() && searchResultIndices.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentSearchIndex >= 0 ? currentSearchIndex + 1 : 0} / {searchResultIndices.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousSearch}
              disabled={searchResultIndices.length === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextSearch}
              disabled={searchResultIndices.length === 0}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
        <div className="overflow-auto h-[calc(100vh-439px)]">
          <ScrollArea
            onScrollCapture={handleScroll}
            ref={scrollAreaRef}
            className="flex-1"
          >
            <div data-component-id={componentId} className="p-4 space-y-4">
              {hasMore && (
                <div className="flex justify-center py-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
              {displayMessages?.map((message: ChatMessageDto, index: number) => {
                const isSearchResult = searchQuery.trim() && messageMatchesSearch(message, searchQuery);
                const isCurrentSearchResult = isSearchResult && searchResultIndices[currentSearchIndex] === index;

                return (
                  <div
                    key={message.id}
                    ref={(el) => {
                      if (el) {
                        messageRefs.current.set(message.id, el);
                      } else {
                        messageRefs.current.delete(message.id);
                      }
                    }}
                    className={`relative ${isCurrentSearchResult ? "ring-1 ring-primary/30 ring-offset-2 rounded-lg" : ""}`}
                  >
                    <MessageItemView
                      message={message}
                      onDelete={onDelete}
                      searchQuery={searchQuery}
                      isHighlighted={isCurrentSearchResult}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

          </ScrollArea>
        </div>
    </div>
  );
}

