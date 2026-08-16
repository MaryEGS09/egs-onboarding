export interface StorageAdapter {
  /** Persists a file and returns the storage path/key used to retrieve it later. */
  put(buffer: Buffer, key: string, mimeType?: string): Promise<string>;
  /** Reads back a previously stored file. */
  get(key: string): Promise<Buffer>;
  /** Returns a URL (or route) the browser can use to fetch/stream the file. */
  urlFor(key: string): string;
  delete(key: string): Promise<void>;
}

let cachedAdapter: StorageAdapter | null = null;

export async function getStorageAdapter(): Promise<StorageAdapter> {
  if (cachedAdapter) return cachedAdapter;

  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "local") {
    const { LocalStorageAdapter } = await import("./local");
    cachedAdapter = new LocalStorageAdapter();
    return cachedAdapter;
  }

  throw new Error(
    `Unsupported STORAGE_PROVIDER "${provider}". Only "local" is implemented; add an S3-compatible adapter here when needed.`,
  );
}
