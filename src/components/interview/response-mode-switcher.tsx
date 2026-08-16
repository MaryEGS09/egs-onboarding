"use client";

import { Mic, Video, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { key: "voice" as const, label: "Voice", icon: Mic },
  { key: "video" as const, label: "Video", icon: Video },
  { key: "text" as const, label: "Text", icon: Keyboard },
];

export function ResponseModeSwitcher({
  value,
  onChange,
  voiceEnabled = true,
  videoEnabled = true,
}: {
  value: "text" | "voice" | "video";
  onChange: (mode: "text" | "voice" | "video") => void;
  voiceEnabled?: boolean;
  videoEnabled?: boolean;
}) {
  return (
    <div className="mx-auto flex w-fit gap-1 rounded-full border bg-muted p-1">
      {MODES.filter((m) => (m.key === "voice" ? voiceEnabled : m.key === "video" ? videoEnabled : true)).map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
            value === m.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <m.icon className="size-4" />
          {m.label}
        </button>
      ))}
    </div>
  );
}
