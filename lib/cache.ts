interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class TtlCache<T = unknown> {
  private store = new Map<string, Entry<T>>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(options: { ttlSeconds?: number; maxEntries?: number } = {}) {
    this.ttlMs = (options.ttlSeconds ?? 300) * 1000;
    this.maxEntries = options.maxEntries ?? 500;
  }

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency for LRU behaviour.
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set(key: string, value: T, ttlMs = this.ttlMs): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next();
      if (!oldest.done) this.store.delete(oldest.value);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/** One shared cache per server process. Best-effort, never authoritative. */
export const appCache = new TtlCache<unknown>({
  ttlSeconds: Number(process.env.TUNESHIFT_CACHE_TTL_SECONDS ?? 300),
  maxEntries: 1000,
});

export async function cached<T>(
  key: string,
  produce: () => Promise<T>,
  ttlSeconds?: number,
): Promise<T> {
  const hit = appCache.get(key) as T | undefined;
  if (hit !== undefined) return hit;
  const value = await produce();
  appCache.set(key, value, ttlSeconds ? ttlSeconds * 1000 : undefined);
  return value;
}
