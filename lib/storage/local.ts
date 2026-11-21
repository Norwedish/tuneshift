import type { AppSettings } from "@/types/music";

export const STORAGE_KEYS = {
  history: "tuneshift.history.v1",
  favorites: "tuneshift.favorites.v1",
  settings: "tuneshift.settings.v1",
  searchHistory: "tuneshift.searches.v1",
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  reduceMotion: false,
  showExplicit: true,
};

const memory = new Map<string, unknown>();
const STORAGE_EVENT = "tuneshift:storage";

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJson<T>(key: string, fallback: T): T {
  if (memory.has(key)) return memory.get(key) as T;
  if (!hasWindow()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    memory.set(key, parsed);
    return parsed;
  } catch {
    // Corrupt payload: keep it out of the way instead of crashing the app.
    return fallback;
  }
}

export function writeJson<T>(key: string, value: T): { ok: boolean; error?: string } {
  memory.set(key, value);
  if (hasWindow()) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return {
        ok: false,
        error: "Your browser storage is full or blocked. Changes are kept for this session only.",
      };
    }
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
  }
  return { ok: true };
}

export function removeKey(key: string): void {
  memory.delete(key);
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key } }));
}

export function subscribeStorage(key: string, callback: () => void): () => void {
  if (!hasWindow()) return () => {};
  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ key?: string }>).detail;
    if (!detail || detail.key === key) callback();
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) callback();
  };
  window.addEventListener(STORAGE_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STORAGE_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isPlatform(value: unknown): value is "spotify" | "youtube" {
  return value === "spotify" || value === "youtube";
}

export function isKind(value: unknown): value is "track" | "album" | "playlist" {
  return value === "track" || value === "album" || value === "playlist";
}

export function sanitizeSettings(value: unknown): AppSettings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;
  const theme =
    value.theme === "light" || value.theme === "dark" || value.theme === "system"
      ? value.theme
      : DEFAULT_SETTINGS.theme;
  return {
    theme,
    reduceMotion:
      typeof value.reduceMotion === "boolean" ? value.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    showExplicit:
      typeof value.showExplicit === "boolean" ? value.showExplicit : DEFAULT_SETTINGS.showExplicit,
  };
}
