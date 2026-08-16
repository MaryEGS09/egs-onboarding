"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/stores/onboarding-store";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AI_SPECIALIST_AVATAR, AI_SPECIALIST_NAME } from "@/lib/copy/onboarding-copy";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="my-2 self-center rounded-full bg-muted px-4 py-1.5 text-xs text-muted-foreground">
        {message.content}
      </div>
    );
  }

  const isClient = message.role === "client";
  return (
    <div className={cn("flex w-full items-end gap-2", isClient ? "justify-end" : "justify-start")}>
      {!isClient && (
        <Avatar size="sm" className="mb-0.5 shrink-0">
          <AvatarImage src={AI_SPECIALIST_AVATAR} alt={AI_SPECIALIST_NAME} />
          <AvatarFallback>{AI_SPECIALIST_NAME[0]}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isClient ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
          message.variant === "followup" && !isClient && "border border-primary/30",
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
