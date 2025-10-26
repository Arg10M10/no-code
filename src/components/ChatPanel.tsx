import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Send, Plus, Monitor, ImageUp, History } from "lucide-react";
import { StoredMessage } from "@/lib/projects";

interface ChatPanelProps {
  messages: StoredMessage[];
  loading: boolean;
  onSend: (text: string) => Promise<void>;
  credits: number;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  loading,
  onSend,
}) => {
  const [input, setInput] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    await onSend(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow p-4 overflow-y-auto min-h-0">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 mb-4 ${
              msg.role === "user" ? "justify-end" : ""
            }`}
          >
            {msg.role === "assistant" && (
              <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm shrink-0">
                D
              </div>
            )}
            <div
              className={`flex flex-col ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <p className="font-bold text-sm mb-1">
                {msg.role === "user" ? "Tú" : "Dyad"}
              </p>
              <div
                className={`p-3 rounded-lg max-w-md ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
            {msg.role === "user" && (
              <div className="bg-muted text-muted-foreground rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm shrink-0">
                T
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-border/60 bg-card/60 flex-shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe los cambios que quieres hacer..."
            className="pr-20 pl-12 min-h-[48px] resize-none"
            rows={1}
            disabled={loading}
          />
          <div className="absolute left-2 bottom-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-2 mb-2"
                side="top"
                align="start"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    className="justify-start px-2 py-1.5 h-auto text-sm font-normal"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Subir screenshot
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start px-2 py-1.5 h-auto text-sm font-normal"
                  >
                    <ImageUp className="h-4 w-4 mr-2" />
                    Subir foto
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start px-2 py-1.5 h-auto text-sm font-normal"
                  >
                    <History className="h-4 w-4 mr-2" />
                    Ver historial
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 bottom-2 h-8 w-8"
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;