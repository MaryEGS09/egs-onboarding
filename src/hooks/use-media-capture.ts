"use client";

import { useCallback, useRef, useState } from "react";

type CaptureState = "idle" | "recording" | "reviewing";

// Minimal shape of the non-standard Web Speech API — no official TS lib types ship for it.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as unknown as Record<string, unknown>).webkitSpeechRecognition || (window as unknown as Record<string, unknown>).SpeechRecognition);
}

export function useMediaCapture(kind: "AUDIO" | "VIDEO") {
  const [state, setState] = useState<CaptureState>("idle");
  const [transcript, setTranscript] = useState("");
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    finalTranscriptRef.current = "";
    chunksRef.current = [];

    try {
      const constraints: MediaStreamConstraints = kind === "VIDEO" ? { audio: true, video: true } : { audio: true };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      const recorder = new MediaRecorder(mediaStream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setMediaBlob(blob);
      };
      recorder.start();
      recorderRef.current = recorder;

      const SpeechRecognitionCtor =
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition ??
        (window as unknown as Record<string, unknown>).SpeechRecognition;

      if (SpeechRecognitionCtor) {
        const recognition = new (SpeechRecognitionCtor as new () => SpeechRecognitionLike)();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";
        recognition.onresult = (event) => {
          const e = event as { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const result = e.results[i];
            if (result.isFinal) {
              finalTranscriptRef.current += result[0].transcript + " ";
            } else {
              interim += result[0].transcript;
            }
          }
          setTranscript((finalTranscriptRef.current + interim).trim());
        };
        recognition.onerror = () => {
          // Swallow — transcript stays editable, client can type/fix manually.
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      setState("recording");
    } catch {
      setError("We couldn't access your microphone/camera. Please check permissions, or switch to text.");
    }
  }, [kind]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    recognitionRef.current?.stop();
    stream?.getTracks().forEach((t) => t.stop());
    setState("reviewing");
  }, [stream]);

  const reset = useCallback(() => {
    setState("idle");
    setTranscript("");
    setMediaBlob(null);
    setStream(null);
    finalTranscriptRef.current = "";
  }, []);

  return { state, transcript, setTranscript, mediaBlob, stream, error, start, stop, reset };
}
