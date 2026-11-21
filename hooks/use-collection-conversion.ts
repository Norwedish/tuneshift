"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { summarizeConversions, type TrackConversion } from "@/lib/conversion/summary";
import type { ApiErrorBody } from "@/types/api";
import type { Collection, MatchCandidate, MatchResult, Platform } from "@/types/music";

const CONCURRENCY = 3;

interface MatchResponseBody {
  match?: MatchResult;
  error?: ApiErrorBody["error"];
}

function isRecommended(candidate: MatchCandidate | undefined): "matched" | "uncertain" | "failed" {
  if (!candidate) return "failed";
  return candidate.confidence === "excellent" || candidate.confidence === "good"
    ? "matched"
    : "uncertain";
}

export function useCollectionConversion(collection: Collection | null, destination: Platform) {
  const [items, setItems] = useState<TrackConversion[]>([]);
  const [running, setRunning] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const itemsRef = useRef<TrackConversion[]>([]);
  const runToken = useRef(0);
  const startedRef = useRef(false);

  const commit = useCallback((updater: (previous: TrackConversion[]) => TrackConversion[]) => {
    setItems((previous) => {
      const next = updater(previous);
      itemsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const initial: TrackConversion[] = (collection?.tracks ?? []).map((track) => ({
      source: track,
      state: "pending",
    }));
    itemsRef.current = initial;
    setItems(initial);
    setRunning(false);
    setActiveCount(0);
    startedRef.current = false;
    runToken.current += 1;
  }, [collection]);

  const runQueue = useCallback(
    async (indexes: number[]) => {
      if (!collection || indexes.length === 0) return;
      const token = ++runToken.current;
      setRunning(true);

      const queue = [...indexes];
      let active = 0;

      const worker = async () => {
        while (queue.length > 0) {
          if (runToken.current !== token) return;
          const index = queue.shift();
          if (index === undefined) return;
          const item = itemsRef.current[index];
          if (!item) continue;

          active += 1;
          setActiveCount(active);
          commit((previous) =>
            previous.map((entry, entryIndex) =>
              entryIndex === index ? { ...entry, state: "matching", error: undefined } : entry,
            ),
          );

          try {
            const response = await fetch("/api/match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ track: item.source, destination, limit: 8 }),
            });
            const body = (await response.json()) as MatchResponseBody;

            if (runToken.current !== token) return;

            if (!response.ok) {
              commit((previous) =>
                previous.map((entry, entryIndex) =>
                  entryIndex === index
                    ? {
                        ...entry,
                        state: "failed",
                        error:
                          body.error ?? {
                            code: "internal",
                            message: "Matching failed.",
                          },
                      }
                    : entry,
                ),
              );
              continue;
            }

            const match = body.match ?? null;
            commit((previous) =>
              previous.map((entry, entryIndex) =>
                entryIndex === index
                  ? { ...entry, state: isRecommended(match?.best ?? undefined), match: match ?? undefined }
                  : entry,
              ),
            );
          } catch {
            if (runToken.current !== token) return;
            commit((previous) =>
              previous.map((entry, entryIndex) =>
                entryIndex === index
                  ? {
                      ...entry,
                      state: "failed",
                      error: {
                        code: "network",
                        message: "Couldn't reach TuneShift.",
                        hint: "Check your connection and retry this track.",
                      },
                    }
                  : entry,
              ),
            );
          } finally {
            active -= 1;
            setActiveCount(active);
          }
        }
      };

      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));

      if (runToken.current === token) {
        setRunning(false);
        setActiveCount(0);
      }
    },
    [collection, destination, commit],
  );

  const startAll = useCallback(() => {
    startedRef.current = true;
    const pending = itemsRef.current
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.state === "pending" || item.state === "failed")
      .map(({ index }) => index);
    void runQueue(pending);
  }, [runQueue]);

  const retryOne = useCallback(
    (index: number) => {
      void runQueue([index]);
    },
    [runQueue],
  );

  const retryFailed = useCallback(() => {
    const failed = itemsRef.current
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.state === "failed")
      .map(({ index }) => index);
    void runQueue(failed);
  }, [runQueue]);

  const reset = useCallback(() => {
    runToken.current += 1;
    const cleared = itemsRef.current.map((item) => ({
      source: item.source,
      state: "pending" as const,
    }));
    itemsRef.current = cleared;
    setItems(cleared);
    setRunning(false);
    setActiveCount(0);
    startedRef.current = false;
  }, []);

  const select = useCallback(
    (index: number, candidate: MatchCandidate) => {
      commit((previous) =>
        previous.map((entry, entryIndex) => {
          if (entryIndex !== index || !entry.match) return entry;
          const candidates = entry.match.candidates.some(
            (item) => item.track.id === candidate.track.id,
          )
            ? entry.match.candidates
            : [candidate, ...entry.match.candidates];
          return {
            ...entry,
            manualSelection: true,
            state: isRecommended(candidate),
            match: {
              ...entry.match,
              best: candidate,
              candidates,
              confidence: candidate.confidence,
              score: candidate.score,
            },
          };
        }),
      );
    },
    [commit],
  );

  const summary = useMemo(() => summarizeConversions(items), [items]);
  const progress = useMemo(() => {
    if (summary.total === 0) return 0;
    return (summary.total - summary.pending) / summary.total;
  }, [summary]);

  const started = startedRef.current || summary.pending < summary.total;

  return {
    items,
    running,
    activeCount,
    summary,
    progress,
    started,
    startAll,
    retryOne,
    retryFailed,
    reset,
    select,
  };
}
