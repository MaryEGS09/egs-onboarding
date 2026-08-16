"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const RESPONSE_TYPES = ["TEXT", "LONG_TEXT", "SINGLE_CHOICE", "MULTI_CHOICE", "URL", "NUMBER", "CURRENCY", "VOICE", "VIDEO", "FILE_UPLOAD"];

export type QuestionFormValue = {
  id?: string;
  sectionId: string;
  key: string;
  prompt: string;
  helpText?: string;
  responseType: string;
  required: boolean;
  aiInstructions: string;
  minConfidence: number;
  voiceEnabled: boolean;
  videoEnabled: boolean;
  allowFileUpload: boolean;
  options: { value: string; label: string; allowFreeText: boolean }[];
};

export function QuestionFormPanel({
  open,
  onOpenChange,
  initialValue,
  onSave,
  onArchiveToggle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue: QuestionFormValue;
  onSave: (value: QuestionFormValue) => Promise<void>;
  onArchiveToggle?: (archived: boolean) => Promise<void>;
}) {
  const [value, setValue] = useState<QuestionFormValue>(initialValue);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof QuestionFormValue>(key: K, val: QuestionFormValue[K]) {
    setValue((prev) => ({ ...prev, [key]: val }));
  }

  const needsOptions = value.responseType === "SINGLE_CHOICE" || value.responseType === "MULTI_CHOICE";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{initialValue.id ? "Edit Question" : "New Question"}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="flex flex-col gap-1.5">
            <Label>Question key (stable identifier)</Label>
            <Input value={value.key} onChange={(e) => update("key", e.target.value)} disabled={Boolean(initialValue.id)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Question prompt</Label>
            <Textarea value={value.prompt} onChange={(e) => update("prompt", e.target.value)} rows={2} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Help text (optional)</Label>
            <Input value={value.helpText ?? ""} onChange={(e) => update("helpText", e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Response type</Label>
            <Select value={value.responseType} onValueChange={(v) => update("responseType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsOptions && (
            <div className="flex flex-col gap-2">
              <Label>Options</Label>
              {value.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="value"
                    value={opt.value}
                    onChange={(e) =>
                      update(
                        "options",
                        value.options.map((o, oi) => (oi === i ? { ...o, value: e.target.value } : o)),
                      )
                    }
                  />
                  <Input
                    placeholder="label"
                    value={opt.label}
                    onChange={(e) =>
                      update(
                        "options",
                        value.options.map((o, oi) => (oi === i ? { ...o, label: e.target.value } : o)),
                      )
                    }
                  />
                  <Button variant="ghost" size="icon" onClick={() => update("options", value.options.filter((_, oi) => oi !== i))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => update("options", [...value.options, { value: "", label: "", allowFreeText: false }])}
              >
                <Plus className="mr-1 size-4" /> Add option
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label>Required</Label>
            <Switch checked={value.required} onCheckedChange={(v) => update("required", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Voice responses enabled</Label>
            <Switch checked={value.voiceEnabled} onCheckedChange={(v) => update("voiceEnabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Video responses enabled</Label>
            <Switch checked={value.videoEnabled} onCheckedChange={(v) => update("videoEnabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Allow file upload</Label>
            <Switch checked={value.allowFileUpload} onCheckedChange={(v) => update("allowFileUpload", v)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>AI instructions</Label>
            <Textarea
              value={value.aiInstructions}
              onChange={(e) => update("aiInstructions", e.target.value)}
              rows={3}
              placeholder="e.g. Encourage the client to give a specific example if the answer is vague."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Minimum confidence to auto-accept ({value.minConfidence.toFixed(2)})</Label>
            <Input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={value.minConfidence}
              onChange={(e) => update("minConfidence", Number(e.target.value))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                await onSave(value);
                setSaving(false);
                onOpenChange(false);
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            {initialValue.id && onArchiveToggle && (
              <Button variant="outline" onClick={() => onArchiveToggle(true)}>
                Archive
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
