import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const RESPONSE_TYPES = ["TEXT", "LONG_TEXT", "SINGLE_CHOICE", "MULTI_CHOICE", "URL", "NUMBER", "CURRENCY", "VOICE", "VIDEO", "FILE_UPLOAD"] as const;

const UpdateSchema = z.object({
  prompt: z.string().min(1).optional(),
  helpText: z.string().nullable().optional(),
  responseType: z.enum(RESPONSE_TYPES).optional(),
  required: z.boolean().optional(),
  aiInstructions: z.string().min(1).optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  voiceEnabled: z.boolean().optional(),
  videoEnabled: z.boolean().optional(),
  allowFileUpload: z.boolean().optional(),
  validationRules: z.record(z.string(), z.unknown()).nullable().optional(),
  archived: z.boolean().optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.string(), allowFreeText: z.boolean().default(false) }))
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = UpdateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });

  const { options, archived, validationRules, ...rest } = parsed.data;

  const question = await prisma.$transaction(async (tx) => {
    if (options) {
      await tx.questionOption.deleteMany({ where: { questionId: id } });
      await tx.questionOption.createMany({
        data: options.map((o, i) => ({ ...o, questionId: id, order: i })),
      });
    }
    return tx.question.update({
      where: { id },
      data: {
        ...rest,
        ...(validationRules !== undefined
          ? { validationRules: (validationRules === null ? Prisma.JsonNull : validationRules) as Prisma.InputJsonValue }
          : {}),
        ...(archived === true ? { archived: true, archivedAt: new Date() } : {}),
        ...(archived === false ? { archived: false, archivedAt: null } : {}),
      },
      include: { options: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(question);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answerCount = await prisma.answer.count({ where: { questionId: id } });
  if (answerCount > 0) {
    return NextResponse.json(
      { error: "This question already has client answers recorded — archive it instead of deleting." },
      { status: 400 },
    );
  }
  await prisma.questionOption.deleteMany({ where: { questionId: id } });
  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
