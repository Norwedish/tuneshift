"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MatchPanel } from "./match-panel";
import { useHistory } from "@/hooks/use-history";
import type { ApiErrorBody } from "@/types/api";
import type { MatchCandidate, MatchResult, Platform, Track } from "@/types/music";

export function ConvertTrackDialog({
  open,
  onClose,
  source,
  destination,
  initialMatch = null,
}: {
  open: boolean;
  onClose: () => void;
  source: Track | null;
  destination: Platform;
  initialMatch?: MatchResult | null;
}) {
  const [match, setMatch] = useState<MatchResult | null>(initialMatch);
  const [selection, setSelection] = useState<MatchCandidate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  const recorded = useRef<string | null>(null);
  const { add } = useHistory();

  const run = useCallback(
    async (track: Track) => {
      setLoading(true);
      setError(null);
      setSelection(null);
      try {
        const response = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track, destination, limit: 10 }),
        });
        const body = (await response.json()) as {
          match?: MatchResult;
          error?: ApiErrorBody["error"];
        };
        if (!response.ok) {
          setError(
            body.error ?? {
              code: "internal",
              message: "The destination platform didn't answer.",
              hint: "Try again in a moment.",
            },
          );
          setMatch(null);
          return;
        }
        setMatch(body.match ?? null);
      } catch {
        setError({
          code: "network",
          message: "We couldn't reach TuneShift.",
          hint: "Check your connection, then retry.",
        });
      } finally {
        setLoading(false);
      }
    },
    [destination],
  );

  useEffect(() => {
    if (!open || !source) return;
    recorded.current = null;
    setSelection(null);
    if (initialMatch) {
      setMatch(initialMatch);
      setError(null);
      setLoading(false);
      return;
    }
    setMatch(null);
    void run(source);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source?.id]);

  // Record after a recommendation is actually on screen. Re-recording on a
  // manual choice updates the same history entry (add() dedupes by source).
  useEffect(() => {
    if (!open || !source) return;
    const candidate = selection ?? match?.best ?? null;
    if (!candidate) return;
    const key = `${source.id}->${candidate.track.id}`;
    if (recorded.current === key) return;
    recorded.current = key;
    add({
      sourceUrl: source.url,
      sourcePlatform: source.platform,
      destinationPlatform: candidate.track.platform,
      kind: "track",
      title: source.title,
      subtitle: source.artists.map((artist) => artist.name).join(", "),
      ...(source.artworkUrl ? { artworkUrl: source.artworkUrl } : {}),
      status: candidate.confidence === "low" ? "partial" : "completed",
      destinationUrl: candidate.track.url,
      destinationTitle: candidate.track.title,
      confidence: candidate.confidence,
    });
  }, [open, source, match, selection, add]);

  if (!source) return null;

  const destinationUrl = selection?.track.url ?? match?.best?.track.url;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Review the match"
      description={`${source.title} — ${source.artists[0]?.name ?? "unknown artist"}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
          {destinationUrl ? (
            <a
              href={destinationUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-full btn-primary px-3 text-[15px] font-medium transition-[filter,box-shadow] duration-150"
            >
              Open destination
            </a>
          ) : null}
        </>
      }
    >
      <MatchPanel
        source={source}
        destination={destination}
        match={match}
        loading={loading}
        error={error}
        onRetry={() => void run(source)}
        onSelectionChange={setSelection}
      />
    </Dialog>
  );
}
