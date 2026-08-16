import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getStorageAdapter } from "@/lib/storage/adapter";
import { requireSessionAccess } from "@/lib/session/access";
import { auth } from "@/lib/auth/admin-auth";

// The dynamic segment carries the full "sessionId/uuid.ext" key, URL-encoded by the client.
export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key: encodedKey } = await params;
  const key = decodeURIComponent(encodedKey);
  const sessionId = key.split("/")[0];

  const media = await prisma.mediaUpload.findFirst({ where: { storagePath: key } });
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const adminSession = await auth();
  if (!adminSession) {
    const access = await requireSessionAccess(req, sessionId);
    if (!access.ok) return access.response;
  }

  const storage = await getStorageAdapter();
  const buffer = await storage.get(key);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": media.mimeType ?? "application/octet-stream",
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
