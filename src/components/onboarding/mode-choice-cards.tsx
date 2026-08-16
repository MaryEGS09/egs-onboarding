"use client";

import { useRouter } from "next/navigation";
import { MessageSquareText, Video } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MODES = [
  {
    mode: "chat" as const,
    icon: MessageSquareText,
    title: "Chat with AI",
    description: "Answer our onboarding questions through a guided text conversation, at your own pace.",
  },
  {
    mode: "interview" as const,
    icon: Video,
    title: "AI Virtual Interview",
    description: "Have a natural conversation with our AI — answer with voice, video, or text, whichever you prefer.",
  },
];

export function ModeChoiceCards() {
  const router = useRouter();

  return (
    <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
      {MODES.map(({ mode, icon: Icon, title, description }) => (
        <Card
          key={mode}
          className="cursor-pointer border-2 transition-colors hover:border-primary"
          onClick={() => router.push(`/onboarding/confirm/${mode}`)}
        >
          <CardHeader>
            <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      ))}
    </div>
  );
}
