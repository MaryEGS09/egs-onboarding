import { create } from "zustand";
import type { QuestionDescriptor } from "@/lib/api/onboarding-client";

export type ChatMessage = {
  id: string;
  role: "client" | "assistant" | "system";
  content: string;
  variant?: "question" | "followup" | "answer" | "transition";
};

type OnboardingState = {
  sessionId: string | null;
  mode: "CHAT" | "INTERVIEW" | null;
  messages: ChatMessage[];
  currentQuestion: QuestionDescriptor | null;
  inputMode: "text" | "voice" | "video";
  isSaving: boolean;
  lastSavedAt: number | null;
  sessionComplete: boolean;

  setSession: (sessionId: string, mode: "CHAT" | "INTERVIEW") => void;
  addMessage: (message: Omit<ChatMessage, "id">) => void;
  setCurrentQuestion: (question: QuestionDescriptor | null) => void;
  setInputMode: (mode: "text" | "voice" | "video") => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;
  setSessionComplete: (complete: boolean) => void;
  reset: () => void;
};

let messageCounter = 0;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  sessionId: null,
  mode: null,
  messages: [],
  currentQuestion: null,
  inputMode: "text",
  isSaving: false,
  lastSavedAt: null,
  sessionComplete: false,

  setSession: (sessionId, mode) => set({ sessionId, mode }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: `m${messageCounter++}` }],
    })),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  setInputMode: (mode) => set({ inputMode: mode }),
  setSaving: (saving) => set({ isSaving: saving }),
  markSaved: () => set({ lastSavedAt: Date.now(), isSaving: false }),
  setSessionComplete: (complete) => set({ sessionComplete: complete }),
  reset: () =>
    set({
      sessionId: null,
      mode: null,
      messages: [],
      currentQuestion: null,
      inputMode: "text",
      isSaving: false,
      lastSavedAt: null,
      sessionComplete: false,
    }),
}));
