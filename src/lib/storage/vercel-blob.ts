import { put, del } from "@vercel/blob";
import type { StorageAdapter } from "./adapter";

export class VercelBlobStorageAdapter implements StorageAdapter {
  async put(buffer: Buffer, key: string, mimeType?: string): Promise<string> {
    const result = await put(key, buffer, {
      access: "public",
      contentType: mimeType,
      addRandomSuffix: true,
    });
    // The blob's public URL becomes the adapter's key for all future lookups —
    // callers must persist this return value, not the input `key`.
    return result.url;
  }

  async get(key: string): Promise<Buffer> {
    const res = await fetch(key);
    if (!res.ok) {
      throw new Error(`Failed to fetch blob at ${key}: ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  urlFor(key: string): string {
    // Route playback through our own access-gated endpoint rather than the raw
    // public blob URL, so admin/owning-client checks still apply.
    return `/api/media/file/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    await del(key);
  }
}
