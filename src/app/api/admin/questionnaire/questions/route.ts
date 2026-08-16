import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const RESPONSE_TYPES = ["TEXT", "LONG_TEXT", "SINGLE_CHOICE", "MULTI_CHOICE", "URL", "NUMBER", "CURRENCY", "VOICE", "VIDEO", "FILE_UPLOAD"] as const;

export async function GET(req: NextRequest) {
  const sectionId = req.nextUrl.searchParams.get("sectionId");
  const includeArchived = req.nextUrl.searchParams.get("includeArchived") === "true";
  const questions = await prisma.question.findMany({
    where: {
      ...(sectionId ? { sectionId } : {}),
      ...(includeArchived ? {} : { archived: false }),
    },
    orderBy: { order: "asc" },
    include: { options: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(questions);
}

const CreateSchema = z.object({
  sectionId: z.string().min(1),
  key: z.string().min(1),
  prompt: z.string().min(1),
  helpText: z.string().optional(),
  responseType: z.enum(RESPONSE_TYPES),
  required: z.boolean().default(true),
  aiInstructions: z.string().min(1),
  minConfidence: z.number().min(0).max(1).default(0.7),
  voiceEnabled: z.boolean().default(true),
  videoEnabled: z.boolean().default(true),
  allowFileUpload: z.boolean().default(false),
  validationRules: z.record(z.string(), z.unknown()).optional(),
  options: z
    .array(z.object({ value: z.string(), label: z.string(), allowFreeText: z.boolean().default(false) }))
    .optional(),
});

export async function POST(req: NextRequest) {
  const parsed = CreateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });

  const { options, ...questionData } = parsed.data;
  const maxOrder = await prisma.question.aggregate({ _max: { order: true }, where: { sectionId: questionData.sectionId } });

  const question = await prisma.question.create({
    data: {
      ...questionData,
      validationRules: questionData.validationRules as Prisma.InputJsonValue | undefined,
      order: (maxOrder._max.order ?? -1) + 1,
      options: options ? { create: options.map((o, i) => ({ ...o, order: i })) } : undefined,
    },
    include: { options: true },
  });

  return NextResponse.json(question, { status: 201 });
}
