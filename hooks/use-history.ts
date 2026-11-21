"use client";

import { useCallback } from "react";
import {
  STORAGE_KEYS,
  isKind,
  isPlatform,
  isRecord,
  isString,
} from "@/lib/storage/local";
import { useLocalStore } from "./use-local-store";
import type { HistoryEntry } from "@/types/music";

const MAX_HISTORY = 250;

function sanitizeHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  const entries: HistoryEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (!isString(item.id) || !isString(item.title)) continue;
    if (!isPlatform(item.sourcePlatform) || !isPlatform(item.destinationPlatform)) continue;
    if (!isKind(item.kind)) continue;
    if (typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt)) continue;
    if (!isString(item.sourceUrl)) continue;
    if (item.status !== "completed" && item.status !== "partial" && item.status !== "failed") {
      continue;
    }
    entries.push({
      id: item.id,
      createdAt: item.createdAt,
      sourceUrl: item.sourceUrl,
      sourcePlatform: item.sourcePlatform,
      destinationPlatform: item.destinationPlatform,
      kind: item.kind,
      title: item.title,
      status: item.status,
      ...(isString(item.subtitle) ? { subtitle: item.subtitle } : {}),
      ...(isString(item.artworkUrl) ? { artworkUrl: item.artworkUrl } : {}),
      ...(typeof item.trackCount === "number" ? { trackCount: item.trackCount } : {}),
      ...(isString(item.destinationUrl) ? { destinationUrl: item.destinationUrl } : {}),
      ...(isString(item.destinationTitle) ? { destinationTitle: item.destinationTitle } : {}),
      ...(item.confidence === "excellent" ||
      item.confidence === "good" ||
      item.confidence === "possible" ||
      item.confidence === "low"
        ? { confidence: item.confidence }
        : {}),
      ...(typeof item.matchedCount === "number" ? { matchedCount: item.matchedCount } : {}),
      ...(typeof item.uncertainCount === "number" ? { uncertainCount: item.uncertainCount } : {}),
      ...(typeof item.failedCount === "number" ? { failedCount: item.failedCount } : {}),
    });
    if (entries.length >= MAX_HISTORY) break;
  }
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export type NewHistoryEntry = Omit<HistoryEntry, "id" | "createdAt">;

export function useHistory() {
  const { value: entries, setValue, hydrated, error: storageError } = useLocalStore<HistoryEntry[]>(
    STORAGE_KEYS.history,
    [],
    sanitizeHistory,
  );

  const add = useCallback(
    (entry: NewHistoryEntry) => {
      setValue((previous) => {
        const now = Date.now();
        const next: HistoryEntry = {
          ...entry,
          id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: now,
        };

        // Repeating the same conversion shouldn't stack duplicates.
        const filtered = previous.filter(
          (existing) =>
            !(
              existing.sourceUrl === next.sourceUrl &&
              existing.destinationPlatform === next.destinationPlatform &&
              existing.kind === next.kind
            ),
        );
        return [next, ...filtered].slice(0, MAX_HISTORY);
      });
    },
    [setValue],
  );

  const remove = useCallback(
    (id: string) => {
      setValue((previous) => previous.filter((entry) => entry.id !== id));
    },
    [setValue],
  );

  const clear = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return {
    entries,
    hydrated,
    storageError,
    add,
    remove,
    clear,
  };
}
