"use client";

import { useEffect, useRef } from "react";
import { Video, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMediaCapture } from "@/hooks/use-media-capture";

export function VideoCaptureControl({ onUseAnswer, disabled }: { onUseAnswer: (transcript: string, blob: Blob) => void; disabled?: boolean }) {
  const capture = useMediaCapture("VIDEO");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && capture.stream) {
      videoRef.current.srcObject = capture.stream;
    }
  }, [capture.stream]);

  if (capture.state === "idle") {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <button
          type="button"
          disabled={disabled}
          onClick={capture.start}
          className="flex size-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 disabled:opacity-50"
        >
          <Video className="size-8" />
        </button>
        <p className="text-sm text-muted-foreground">🎥 Answer with Video</p>
        {capture.error && <p className="text-xs text-destructive">{capture.error}</p>}
      </div>
    );
  }

  if (capture.state === "recording") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full max-w-sm rounded-lg bg-black object-cover" />
        <button
          type="button"
          onClick={capture.stop}
          className="flex size-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg"
        >
          <Square className="size-6" />
        </button>
        <p className="text-sm text-muted-foreground">Recording… tap to stop</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-4">
      <p className="text-xs font-medium text-muted-foreground">Review your answer (you can edit the text below):</p>
      <Textarea value={capture.transcript} onChange={(e) => capture.setTranscript(e.target.value)} rows={3} placeholder="If we couldn't auto-transcribe, type what you said here." />
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
