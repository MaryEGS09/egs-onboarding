import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { requireSessionAccess } from "@/lib/session/access";
import { getStorageAdapter } from "@/lib/storage/adapter";

const KIND_TO_EXTENSION: Record<string, string> = { AUDIO: "webm", VIDEO: "webm", FILE: "bin" };

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const access = await requireSessionAccess(req, sessionId);
  if (!access.ok) return access.response;

  const formData = await req.formData();
  const file = formData.get("file");
  const kind = String(formData.get("kind") ?? "FILE").toUpperCase();
  const questionKey = formData.get("questionKey") ? String(formData.get("questionKey")) : undefined;
  const transcriptText = formData.get("transcriptText") ? String(formData.get("transcriptText")) : undefined;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!["AUDIO", "VIDEO", "FILE"].includes(kind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const question = questionKey ? await prisma.question.findUnique({ where: { key: questionKey } }) : null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.name.includes(".") ? file.name.split(".").pop() : KIND_TO_EXTENSION[kind];
  const requestedKey = `${sessionId}/${randomUUID()}.${extension}`;

  const storage = await getStorageAdapter();
  // The adapter's return value is the authoritative storage key/path — for local
  // disk it's the same string we passed in, but for e.g. Vercel Blob it's the
  // actual public URL the file lives at, which is what we need to fetch it later.
  const storedKey = await storage.put(buffer, requestedKey, file.type);

  const mediaUpload = await prisma.mediaUpload.create({
    data: {
      sessionId,
      questionId: question?.id,
      kind: kind as "AUDIO" | "VIDEO" | "FILE",
      storageProvider: process.env.STORAGE_PROVIDER ?? "local",
      storagePath: storedKey,
      originalFilename: file.name,
      mimeType: file.type,
      sizeBytes: buffer.byteLength,
      transcriptStatus: transcriptText ? "COMPLETE" : "NOT_AVAILABLE",
      transcriptText: transcriptText ?? null,
      transcriptSource: transcriptText ? "browser_stt" : null,
      transcribedAt: transcriptText ? new Date() : null,
    },
  });

  return NextResponse.json({
    mediaUploadId: mediaUpload.id,
    url: storage.urlFor(storedKey),
    transcriptStatus: mediaUpload.transcriptStatus,
    transcriptText: mediaUpload.transcriptText,
  });
}
