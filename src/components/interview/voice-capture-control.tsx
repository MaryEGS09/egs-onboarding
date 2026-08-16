"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMediaCapture, isSpeechRecognitionSupported } from "@/hooks/use-media-capture";
import { useState } from "react";

export function VoiceCaptureControl({ onUseAnswer, disabled }: { onUseAnswer: (transcript: string, blob: Blob) => void; disabled?: boolean }) {
  const capture = useMediaCapture("AUDIO");
  const [sttSupported] = useState(() => isSpeechRecognitionSupported());

  if (capture.state === "idle") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <button
          type="button"
          disabled={disabled}
          onClick={capture.start}
          className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
        >
          <Mic className="size-8" />
        </button>
        <p className="text-sm text-muted-foreground">🎤 Tap to Answer</p>
        {!sttSupported && (
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            Your browser can&apos;t auto-transcribe speech — we&apos;ll record your answer, but you&apos;ll need to type it in afterward.
          </p>
        )}
        {capture.error && <p className="text-xs text-destructive">{capture.error}</p>}
      </div>
    );
  }

  if (capture.state === "recording") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <button
          type="button"
          onClick={capture.stop}
          className="flex size-20 animate-pulse items-center justify-center rounded-full bg-destructive text-white shadow-lg"
        >
          <Square className="size-7" />
        </button>
        <p className="text-sm text-muted-foreground">Listening… tap to stop</p>
        {capture.transcript && <p className="max-w-sm text-center text-sm italic text-muted-foreground">&ldquo;{capture.transcript}&rdquo;</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <p className="text-xs font-medium text-muted-foreground">Review your answer (you can edit the text below):</p>
      <Textarea value={capture.transcript} onChange={(e) => capture.setTranscript(e.target.value)} rows={3} />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={capture.reset}>
          Record Again
        </Button>
        <Button
          disabled={!capture.transcript.trim()}
          onClick={() => capture.mediaBlob && onUseAnswer(capture.transcript.trim(), capture.mediaBlob)}
        >
          Use This Answer
        </Button>
      </div>
    </div>
  );
}
