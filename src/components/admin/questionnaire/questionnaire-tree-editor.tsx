"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ChevronUp, ChevronDown, Plus, Pencil, Archive } from "lucide-react";
import { toast } from "sonner";
import { QuestionFormPanel, type QuestionFormValue } from "./question-form-panel";

type Question = {
  id: string;
  key: string;
  prompt: string;
  helpText: string | null;
  responseType: string;
  required: boolean;
  aiInstructions: string;
  minConfidence: number;
  voiceEnabled: boolean;
  videoEnabled: boolean;
  allowFileUpload: boolean;
  archived: boolean;
  options: { value: string; label: string; allowFreeText: boolean }[];
};
type Section = { id: string; key: string; name: string; questions: Question[] };
type Phase = { id: string; key: string; name: string; sections: Section[] };

async function api(path: string, options?: RequestInit) {
  const res = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Request failed");
  return res.json();
}

export function QuestionnaireTreeEditor() {
  const queryClient = useQueryClient();
  const { data: phases, isLoading } = useQuery({
    queryKey: ["admin-questionnaire"],
    queryFn: () => api("/api/admin/questionnaire/phases") as Promise<Phase[]>,
  });

  const [newSectionName, setNewSectionName] = useState<Record<string, string>>({});
  const [newPhaseName, setNewPhaseName] = useState("");
  const [editing, setEditing] = useState<{ sectionId: string; question: Question | null } | null>(null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-questionnaire"] });
  }

  async function reorder(kind: "phases" | "sections" | "questions", ids: string[]) {
    await api(`/api/admin/questionnaire/${kind}/reorder`, { method: "POST", body: JSON.stringify({ orderedIds: ids }) });
    invalidate();
  }

  function moveItem<T extends { id: string }>(items: T[], id: string, direction: -1 | 1): string[] {
    const index = items.findIndex((i) => i.id === id);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return items.map((i) => i.id);
    const reordered = [...items];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    return reordered.map((i) => i.id);
  }

  async function addPhase() {
    if (!newPhaseName.trim()) return;
    await api("/api/admin/questionnaire/phases", {
      method: "POST",
      body: JSON.stringify({ key: slugify(newPhaseName), name: newPhaseName }),
    });
    setNewPhaseName("");
    invalidate();
  }

  async function addSection(phaseId: string) {
    const name = newSectionName[phaseId];
    if (!name?.trim()) return;
    await api("/api/admin/questionnaire/sections", {
      method: "POST",
      body: JSON.stringify({ phaseId, key: slugify(name), name }),
    });
    setNewSectionName((prev) => ({ ...prev, [phaseId]: "" }));
    invalidate();
  }

  async function saveQuestion(sectionId: string, value: QuestionFormValue) {
    try {
      if (value.id) {
        await api(`/api/admin/questionnaire/questions/${value.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...value, sectionId: undefined }),
        });
      } else {
        await api("/api/admin/questionnaire/questions", { method: "POST", body: JSON.stringify({ ...value, sectionId }) });
      }
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save this question.");
    }
  }

  async function archiveQuestion(id: string, archived: boolean) {
    await api(`/api/admin/questionnaire/questions/${id}`, { method: "PATCH", body: JSON.stringify({ archived }) });
    invalidate();
  }

  if (isLoading || !phases) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Input placeholder="New phase name…" value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} />
        <Button onClick={addPhase}>
          <Plus className="mr-1 size-4" /> Add Phase
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={phases.map((p) => p.id)}>
        {phases.map((phase, phaseIndex) => (
          <AccordionItem key={phase.id} value={phase.id}>
            <div className="flex items-center gap-1">
              <AccordionTrigger className="flex-1 text-base font-semibold">{phase.name}</AccordionTrigger>
              <Button variant="ghost" size="icon" disabled={phaseIndex === 0} onClick={() => reorder("phases", moveItem(phases, phase.id, -1))}>
                <ChevronUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={phaseIndex === phases.length - 1}
                onClick={() => reorder("phases", moveItem(phases, phase.id, 1))}
              >
                <ChevronDown className="size-4" />
              </Button>
            </div>
            <AccordionContent>
              <div className="flex flex-col gap-4 pl-2">
                {phase.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-center gap-1">
                      <p className="flex-1 text-sm font-semibold text-muted-foreground">{section.name}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={sectionIndex === 0}
                        onClick={() => reorder("sections", moveItem(phase.sections, section.id, -1))}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={sectionIndex === phase.sections.length - 1}
                        onClick={() => reorder("sections", moveItem(phase.sections, section.id, 1))}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {section.questions
                        .filter((q) => !q.archived)
                        .map((question, questionIndex, arr) => (
                          <div key={question.id} className="flex items-center gap-2 rounded border p-2">
                            <div className="flex-1">
                              <p className="text-sm">{question.prompt}</p>
                              <div className="mt-1 flex gap-1">
                                <Badge variant="outline" className="text-[10px]">
                                  {question.responseType}
                                </Badge>
                                {question.required && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    required
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" disabled={questionIndex === 0} onClick={() => reorder("questions", moveItem(arr, question.id, -1))}>
                              <ChevronUp className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={questionIndex === arr.length - 1}
                              onClick={() => reorder("questions", moveItem(arr, question.id, 1))}
                            >
                              <ChevronDown className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setEditing({ sectionId: section.id, question })}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => archiveQuestion(question.id, true)}>
                              <Archive className="size-4" />
                            </Button>
                          </div>
                        ))}
                    </div>

                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setEditing({ sectionId: section.id, question: null })}>
                      <Plus className="mr-1 size-4" /> Add question
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="New section name…"
                    value={newSectionName[phase.id] ?? ""}
                    onChange={(e) => setNewSectionName((prev) => ({ ...prev, [phase.id]: e.target.value }))}
                  />
                  <Button variant="outline" onClick={() => addSection(phase.id)}>
                    <Plus className="mr-1 size-4" /> Add Section
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {editing && (
        <QuestionFormPanel
          open
          onOpenChange={(open) => !open && setEditing(null)}
          initialValue={
            editing.question
              ? {
                  id: editing.question.id,
                  sectionId: editing.sectionId,
                  key: editing.question.key,
                  prompt: editing.question.prompt,
                  helpText: editing.question.helpText ?? undefined,
                  responseType: editing.question.responseType,
                  required: editing.question.required,
                  aiInstructions: editing.question.aiInstructions,
                  minConfidence: editing.question.minConfidence,
                  voiceEnabled: editing.question.voiceEnabled,
                  videoEnabled: editing.question.videoEnabled,
                  allowFileUpload: editing.question.allowFileUpload,
                  options: editing.question.options,
                }
              : {
                  sectionId: editing.sectionId,
                  key: "",
                  prompt: "",
                  responseType: "TEXT",
                  required: true,
                  aiInstructions: "",
                  minConfidence: 0.7,
                  voiceEnabled: true,
                  videoEnabled: true,
                  allowFileUpload: false,
                  options: [],
                }
          }
          onSave={(value) => saveQuestion(editing.sectionId, value)}
          onArchiveToggle={editing.question ? (archived) => archiveQuestion(editing.question!.id, archived) : undefined}
        />
      )}
    </div>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
