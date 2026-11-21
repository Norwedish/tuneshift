"use client";

import { useCallback } from "react";
import { STORAGE_KEYS, isString } from "@/lib/storage/local";
import { useLocalStore } from "./use-local-store";

const MAX_SEARCHES = 8;

function sanitizeSearches(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => isString(item) && item.trim().length > 0)
    .map((item) => item.trim().slice(0, 160))
    .slice(0, MAX_SEARCHES);
}

export function useSearchHistory() {
  const { value: searches, setValue, hydrated } = useLocalStore<string[]>(
    STORAGE_KEYS.searchHistory,
    [],
    sanitizeSearches,
  );

  const remember = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 2) return;
      setValue((previous) =>
        [trimmed, ...previous.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          MAX_SEARCHES,
        ),
      );
    },
    [setValue],
  );

  const clear = useCallback(() => setValue([]), [setValue]);

  return { searches, hydrated, remember, clear };
}
