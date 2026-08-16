"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Plus, X } from "lucide-react";
import type { QuestionDescriptor } from "@/lib/api/onboarding-client";

export function AnswerInput({
  question,
  disabled,
  onSubmit,
}: {
  question: QuestionDescriptor;
  disabled?: boolean;
  onSubmit: (value: string) => void;
}) {
  if (question.responseType === "SINGLE_CHOICE" && question.options?.length) {
    return <ChoiceInput question={question} disabled={disabled} onSubmit={onSubmit} multi={false} />;
  }
  if (question.responseType === "MULTI_CHOICE" && question.options?.length) {
    return <ChoiceInput question={question} disabled={disabled} onSubmit={onSubmit} multi />;
  }
  if (question.responseType === "URL") {
    return <UrlListInput disabled={disabled} onSubmit={onSubmit} />;
  }
  if (question.responseType === "NUMBER" || question.responseType === "CURRENCY") {
    return <SimpleTextInput disabled={disabled} onSubmit={onSubmit} type="text" placeholder={question.responseType === "CURRENCY" ? "e.g. $250,000" : "Enter a number"} />;
  }
  if (question.responseType === "LONG_TEXT") {
    return <LongTextInput disabled={disabled} onSubmit={onSubmit} />;
  }
  return <SimpleTextInput disabled={disabled} onSubmit={onSubmit} type="text" placeholder="Type your answer…" />;
}

function SimpleTextInput({
  disabled,
  onSubmit,
  placeholder,
}: {
  disabled?: boolean;
  onSubmit: (value: string) => void;
  type: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  function submit() {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  }
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} disabled={disabled} autoFocus />
      <Button type="submit" size="icon" disabled={disabled || !value.trim()}>
        <Send className="size-4" />
      </Button>
    </form>
  );
}

function LongTextInput({ disabled, onSubmit }: { disabled?: boolean; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState("");
  function submit() {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Share as much detail as you'd like…"
        disabled={disabled}
        rows={3}
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || !value.trim()}>
          Send <Send className="ml-1 size-4" />
        </Button>
      </div>
    </form>
  );
}

function ChoiceInput({
  question,
  disabled,
  onSubmit,
  multi,
}: {
  question: QuestionDescriptor;
  disabled?: boolean;
  onSubmit: (value: string) => void;
  multi: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const options = question.options ?? [];

  function toggle(value: string) {
    if (!multi) {
      onSubmit(labelsFor([value]));
      return;
    }
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function labelsFor(values: string[]): string {
    const parts = values.map((v) => {
      const opt = options.find((o) => o.value === v);
      if (opt?.allowFreeText && freeText.trim()) return `${opt.label}: ${freeText.trim()}`;
      return opt?.label ?? v;
    });
    return parts.join(", ");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt.value)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selected.includes(opt.value) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/60"
            }`}
          >
            {multi && <Checkbox checked={selected.includes(opt.value)} className="pointer-events-none" />}
            {opt.label}
          </button>
        ))}
      </div>
      {selected.some((v) => options.find((o) => o.value === v)?.allowFreeText) && (
        <Input
          placeholder="Please describe…"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          disabled={disabled}
        />
      )}
      {multi && (
        <div className="flex justify-end">
          <Button disabled={disabled || selected.length === 0} onClick={() => onSubmit(labelsFor(selected))}>
            Continue <Send className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function UrlListInput({ disabled, onSubmit }: { disabled?: boolean; onSubmit: (value: string) => void }) {
  const [urls, setUrls] = useState<string[]>([""]);

  function updateUrl(index: number, value: string) {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function submit() {
    const cleaned = urls.map((u) => u.trim()).filter(Boolean);
    if (cleaned.length === 0) return;
    onSubmit(cleaned.join(", "));
    setUrls([""]);
  }

  return (
    <div className="flex flex-col gap-2">
      {urls.map((url, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => updateUrl(index, e.target.value)}
            placeholder="https://…"
            disabled={disabled}
          />
          {urls.length > 1 && (
            <Button type="button" variant="ghost" size="icon" onClick={() => setUrls((prev) => prev.filter((_, i) => i !== index))}>
              <X className="size-4" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" size="sm" onClick={() => setUrls((prev) => [...prev, ""])}>
          <Plus className="mr-1 size-4" /> Add another
        </Button>
        <Button disabled={disabled} onClick={submit}>
          Send <Send className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
