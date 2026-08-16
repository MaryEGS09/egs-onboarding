"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export type ReviewSnapshot = {
  generatedAt: string;
  resumeCode: string | null;
  businessName: string | null;
  contactEmail: string | null;
  phases: {
    phaseKey: string;
    phaseName: string;
    sections: {
      sectionName: string;
      questions: {
        questionKey: string;
        prompt: string;
        answer: string | null;
        isComplete: boolean;
        followUps: { aiQuestionText: string; clientResponseText: string | null }[];
        mediaUrl: string | null;
      }[];
    }[];
  }[];
};

export function ReviewDocumentView({ snapshot }: { snapshot: ReviewSnapshot }) {
  return (
    <Accordion type="multiple" defaultValue={snapshot.phases.map((p) => p.phaseKey)} className="w-full">
      {snapshot.phases.map((phase) => (
        <AccordionItem key={phase.phaseKey} value={phase.phaseKey}>
          <AccordionTrigger className="text-base font-semibold">{phase.phaseName}</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-6">
              {phase.sections.map((section, i) => (
                <div key={i} className="flex flex-col gap-4">
                  {section.questions.map((q) => (
                    <div key={q.questionKey} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{q.prompt}</p>
                        {!q.answer && (
                          <Badge variant="outline" className="shrink-0 text-muted-foreground">
                            No answer
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{q.answer ?? "—"}</p>
                      {q.mediaUrl && (
                        <a href={q.mediaUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-primary underline">
                          Listen/watch original recording
                        </a>
                      )}
                      {q.followUps.length > 0 && (
                        <div className="mt-2 border-l-2 border-primary/30 pl-3">
                          {q.followUps.map((f, fi) => (
                            <p key={fi} className="text-xs text-muted-foreground">
                              <span className="font-medium">Follow-up:</span> {f.aiQuestionText}
                              {f.clientResponseText ? ` — ${f.clientResponseText}` : ""}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
