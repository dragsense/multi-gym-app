import { useId, useRef, useState } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  onSend: (message: string, file?: File) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const componentId = useId();
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;
    onSend(message.trim(), selectedFile || undefined);
    setMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div data-component-id={componentId}>
      {selectedFile && (
        <div className="p-2 border-t border-border flex items-center gap-2 bg-muted">
          <Paperclip className="h-4 w-4" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,audio/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message.trim() && !selectedFile}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

