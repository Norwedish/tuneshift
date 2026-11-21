"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readJson, subscribeStorage, writeJson } from "@/lib/storage/local";

/**
 * localStorage-backed state with cross-tab sync.
 * `hydrated` is false during SSR and on the first paint, which lets callers
 * render a neutral skeleton instead of a hydration mismatch.
 */
export function useLocalStore<T>(
  key: string,
  initial: T,
  sanitize: (value: unknown, fallback: T) => T,
) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialRef = useRef(initial);

  const load = useCallback(() => {
    const raw = readJson<unknown>(key, initialRef.current);
    setValue(sanitize(raw, initialRef.current));
  }, [key, sanitize]);

  useEffect(() => {
    load();
    setHydrated(true);
    return subscribeStorage(key, load);
  }, [key, load]);

  const update = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved =
          typeof next === "function" ? (next as (previous: T) => T)(previous) : next;
        const result = writeJson(key, resolved);
        if (!result.ok) setError(result.error ?? "Could not save to this browser.");
        else setError(null);
        return resolved;
      });
    },
    [key],
  );

  return { value, setValue: update, hydrated, error };
}
