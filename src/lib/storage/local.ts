import { promises as fs } from "fs";
import path from "path";
import type { StorageAdapter } from "./adapter";

const BASE_DIR = path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_STORAGE_PATH ?? "./var/media");

export class LocalStorageAdapter implements StorageAdapter {
  private resolve(key: string): string {
    const resolved = path.resolve(BASE_DIR, key);
    if (!resolved.startsWith(BASE_DIR)) {
      throw new Error("Invalid storage key: path traversal detected");
    }
    return resolved;
  }

  async put(buffer: Buffer, key: string): Promise<string> {
    const filePath = this.resolve(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  urlFor(key: string): string {
    return `/api/media/file/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.resolve(key), { force: true });
  }
}
