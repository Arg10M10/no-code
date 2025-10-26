"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type ChatPanelProps = {
  messages: Message[];
};

const ChatPanel: React.FC<ChatPanelProps> = ({ messages }) => {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {messages.map((msg, index) => {
            const isAssistant = msg.role === "assistant";
            const isUser = msg.role === "user";

            return (
              <div key={msg.id ?? index} className="min-w-0">
                <div
                  className={[
                    "p-3 rounded-lg transition-shadow",
                    // Assistant: strong green outline / ring
                    isAssistant
                      ? [
                          "bg-background/60", // keep background consistent with app
                          "border border-green-600/40",
                          "ring-2 ring-offset-1 ring-green-500/40",
                          "shadow-sm"
                        ].join(" ")
                      // User: blue glow
                      : isUser
                      ? [
                          "bg-background/60",
                          // custom heavy blue glow via tailwind arbitrary shadow
                          "shadow-[0_8px_30px_rgba(59,130,246,0.35)]",
                          "border border-blue-500/10"
                        ].join(" ")
                      : "bg-muted-foreground/5 border border-transparent",
                  ].join(" ")}
                >
                  <p className={[
                    "text-sm leading-relaxed break-words",
                    isAssistant ? "text-green-100" : isUser ? "text-blue-100" : "text-muted-foreground"
                  ].join(" ")}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatPanel;