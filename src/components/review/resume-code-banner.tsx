"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function ResumeCodeBanner({ resumeCode }: { resumeCode: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(resumeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-secondary/50 p-3">
      <div>
        <p className="text-xs text-muted-foreground">Your resume code</p>
        <p className="font-mono text-base font-semibold tracking-wide">{resumeCode}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
