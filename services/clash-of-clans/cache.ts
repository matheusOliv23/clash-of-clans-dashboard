type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

const globalForCache = globalThis as unknown as {
  clashCache?: Map<string, CacheEntry>;
  clashInflight?: Map<string, Promise<unknown>>;
};

const store = globalForCache.clashCache ?? new Map<string, CacheEntry>();
const inflight =
  globalForCache.clashInflight ?? new Map<string, Promise<unknown>>();

if (process.env.NODE_ENV !== "production") {
  globalForCache.clashCache = store;
  globalForCache.clashInflight = inflight;
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
  refresh = false,
): Promise<T> {
  const now = Date.now();

  if (!refresh) {
    const hit = store.get(key);
    if (hit && hit.expiresAt > now) {
      return hit.value as T;
    }

    const pending = inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }
  }

  const promise = load()
    .then((value) => {
      store.set(key, { expiresAt: Date.now() + ttlMs, value });
      return value;
    })
    .finally(() => {
      if (inflight.get(key) === promise) {
        inflight.delete(key);
      }
    });

  inflight.set(key, promise);
  return promise as Promise<T>;
}

export function clearClashCache(): void {
  store.clear();
}
