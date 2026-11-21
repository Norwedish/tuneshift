"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ListFilter,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { ConfidenceBadge, PlatformChip } from "@/components/ui/badge";
import { InlineNotice } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ShiftStrip } from "@/components/ui/shift-strip";
import { FavoriteButton, favoriteForTrack } from "@/components/music/favorite-button";
import { useToast } from "@/components/providers/toast-provider";
import { formatDuration } from "@/lib/conversion/summary";
import { platformLabel } from "@/lib/utils/platform";
import { copyToClipboard } from "@/lib/utils/clipboard";
import { cn } from "@/lib/utils/cn";
import type { ApiErrorBody } from "@/types/api";
import type { MatchCandidate, MatchResult, Platform, Track } from "@/types/music";

function TrackCard({
  track,
  label,
  tone = "neutral",
  confidence,
  children,
}: {
  track: Track;
  label: string;
  tone?: "neutral" | "destination";
  confidence?: MatchCandidate["confidence"];
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border p-3",
        tone === "destination"
          ? "border-pine/30 bg-pine/[0.04] dark:bg-pine/[0.06]"
          : "border-line bg-surface-2/40",
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        <div className="flex items-center gap-2">
          <PlatformChip platform={track.platform} size="sm" />
          {confidence ? <ConfidenceBadge confidence={confidence} /> : null}
        </div>
      </div>

      <div className="flex items-start gap-3">
        <Cover src={track.artworkUrl} alt={`${track.title} artwork`} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15.5px] font-medium leading-snug text-ink">{track.title}</p>
          <p className="mt-0.5 truncate text-[15px] text-muted">
            {track.artists.map((artist) => artist.name).join(", ")}
          </p>
          <p className="mt-0.5 truncate font-mono text-[15px] text-faint">
            {[track.album?.name, track.year, formatDuration(track.durationMs)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export function MatchPanel({
  source,
  destination,
  match,
  loading,
  error,
  onRetry,
  onSelectionChange,
  className,
}: {
  source: Track;
  destination: Platform;
  match: MatchResult | null;
  loading: boolean;
  error: ApiErrorBody["error"] | null;
  onRetry?: () => void;
  onSelectionChange?: (candidate: MatchCandidate | null) => void;
  className?: string;
}) {
  const toast = useToast();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    setSelectedIndex(0);
    setShowAlternatives(false);
  }, [match]);

  const candidates = match?.candidates ?? [];
  const selected = candidates[selectedIndex] ?? match?.best ?? null;

  useEffect(() => {
    onSelectionChange?.(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.track.id, selected?.confidence]);

  const alternatives = useMemo(
    () => candidates.filter((_, index) => index !== selectedIndex),
    [candidates, selectedIndex],
  );

  if (loading) {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true">
        <div className="flex items-center justify-between">
          <span className="label">Searching {platformLabel(destination)}</span>
          <span className="font-mono text-[15px] text-faint">matching…</span>
        </div>
        <ShiftStrip segments={48} height="sm" active value={1} className="opacity-70" />
        <div className="rounded-[18px] border border-line bg-surface-2/40 p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-[52px] rounded-[14px]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-2.5 w-1/4" />
              <Skeleton className="h-2 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-3", className)}>
        <TrackCard track={source} label="Source" />
        <InlineNotice tone="danger" title={error.message}>
          <p>{error.hint ?? "The destination platform didn't answer."}</p>
        </InlineNotice>
        {onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry} className="w-full">
            <RefreshCw className="size-3.5" aria-hidden />
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  if (!selected) {
    return (
      <div className={cn("space-y-3", className)}>
        <TrackCard track={source} label="Source" />
        <div className="rounded-[18px] border border-dashed border-line-strong bg-surface-2/40 px-4 py-6 text-center">
          <SearchX className="mx-auto size-5 text-faint" aria-hidden />
          <p className="mt-2 text-[15px] font-medium text-ink">No close match found</p>
          <p className="mx-auto mt-1 max-w-sm text-[15px] leading-relaxed text-muted">
            Nothing on {platformLabel(destination)} scored high enough to recommend. Try the title
            alone, or open {platformLabel(destination)} and check manually.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {onRetry ? (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw className="size-3.5" aria-hidden />
                Retry
              </Button>
            ) : null}
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                `${source.title} ${source.artists[0]?.name ?? ""} ${platformLabel(destination)}`,
              )}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-full btn-secondary px-3 text-[15px] text-ink-2 transition-colors duration-150"
            >
              Search the web
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const track = selected.track;
  const positiveReasons = selected.reasons.slice(0, 3);
  const warnings = selected.warnings.slice(0, 3);

  return (
    <div className={cn("space-y-3", className)}>
      <TrackCard track={source} label="Source">
        <div className="flex items-center justify-between">
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-[15px] text-muted transition-colors hover:text-ink"
          >
            Open on {platformLabel(source.platform)}
            <ArrowUpRight className="size-3" aria-hidden />
          </a>
          <FavoriteButton entry={favoriteForTrack(source)} size="sm" />
        </div>
      </TrackCard>

      <div className="flex items-center gap-3 px-1">
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-surface shadow-xs">
          <ArrowDown className="size-3 text-pine" aria-hidden />
        </span>
        <div className="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--line-strong)_0_4px,transparent_4px_8px)]" />
        <span className="font-mono text-[15px] uppercase tracking-[0.12em] text-faint">
          {Math.round(selected.score * 100)}% · {candidates.length} candidate
          {candidates.length === 1 ? "" : "s"}
        </span>
      </div>

      <TrackCard
        track={track}
        label={`Recommended on ${platformLabel(destination)}`}
        tone="destination"
        confidence={selected.confidence}
      >
        <div className="space-y-2">
          {positiveReasons.length > 0 ? (
            <ul className="space-y-1">
              {positiveReasons.map((reason) => (
                <li key={reason} className="flex items-start gap-1.5 text-[15px] text-muted">
                  <Check className="mt-0.5 size-3 shrink-0 text-ok" aria-hidden />
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}

          {warnings.length > 0 ? (
            <ul className="space-y-1">
              {warnings.map((warning) => (
                <li key={warning} className="flex items-start gap-1.5 text-[15px] text-warn">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={track.url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-8 items-center gap-1.5 rounded-full btn-primary px-3 text-[15px] font-medium transition-[filter,box-shadow] duration-150"
            >
              Open on {platformLabel(destination)}
              <ArrowUpRight className="size-3" aria-hidden />
            </a>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                const copied = await copyToClipboard(track.url);
                if (copied) toast.success("Link copied", track.url);
                else toast.error("Couldn't copy the link");
              }}
            >
              <Copy className="size-3" aria-hidden />
              Copy link
            </Button>
            <FavoriteButton entry={favoriteForTrack(track)} />
          </div>
        </div>
      </TrackCard>

      {alternatives.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowAlternatives((previous) => !previous)}
            aria-expanded={showAlternatives}
            className="flex w-full items-center justify-between rounded-[16px] border border-line bg-surface-2/40 px-3 py-2 text-[15px] text-muted transition-colors hover:text-ink"
          >
            <span className="inline-flex items-center gap-1.5">
              <ListFilter className="size-3" aria-hidden />
              {alternatives.length} alternative{alternatives.length === 1 ? "" : "s"}
            </span>
            <ChevronDown
              className={cn("size-3.5 transition-transform", showAlternatives && "rotate-180")}
              aria-hidden
            />
          </button>

          {showAlternatives ? (
            <div className="mt-2 space-y-1.5">
              {alternatives.map((candidate, index) => {
                const candidateIndex = candidates.findIndex(
                  (item) => item.track.id === candidate.track.id,
                );
                return (
                  <div
                    key={`${candidate.track.platform}:${candidate.track.id}`}
                    className="flex items-center gap-2.5 rounded-[16px] border border-line bg-surface p-2"
                  >
                    <span className="w-4 shrink-0 text-center font-mono text-[15px] text-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Cover src={candidate.track.artworkUrl} alt="" size={32} rounded="rounded-[10px]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-ink">
                        {candidate.track.title}
                      </p>
                      <p className="truncate text-[15px] text-muted">
                        {candidate.track.artists.map((artist) => artist.name).join(", ")} ·{" "}
                        {formatDuration(candidate.track.durationMs)}
                      </p>
                    </div>
                    <span className="tabular shrink-0 font-mono text-[15px] text-faint">
                      {Math.round(candidate.score * 100)}%
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 text-[15px]"
                      onClick={() => {
                        setSelectedIndex(candidateIndex >= 0 ? candidateIndex : 0);
                        setShowAlternatives(false);
                      }}
                    >
                      Use
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
