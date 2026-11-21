"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardPaste,
  Copy,
  Download,
  ListFilter,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cover } from "@/components/ui/cover";
import { ConfidenceBadge, PlatformChip } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { InlineNotice } from "@/components/ui/empty-state";
import { ProgressBar, ShiftStrip } from "@/components/ui/shift-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchPanel } from "@/components/converter/match-panel";
import { useToast } from "@/components/providers/toast-provider";
import { useHistory } from "@/hooks/use-history";
import { useCollectionConversion } from "@/hooks/use-collection-conversion";
import {
  exportConversions,
  formatDuration,
  selectedTrack,
  type ExportFormat,
  type TrackConversion,
} from "@/lib/conversion/summary";
import { copyToClipboard, downloadFile } from "@/lib/utils/clipboard";
import { platformLabel } from "@/lib/utils/platform";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { ApiErrorBody } from "@/types/api";
import type { Collection, CollectionKind, MatchCandidate, Platform, Track } from "@/types/music";

type ResolveBody =
  | {
      kind: "track";
      track: Track;
    }
  | {
      kind: CollectionKind;
      collection: Collection;
    }
  | { error: ApiErrorBody["error"] };

function statusLabel(state: TrackConversion["state"]): string {
  switch (state) {
    case "matching":
      return "Matching";
    case "matched":
      return "Matched";
    case "uncertain":
      return "Review";
    case "failed":
      return "Not found";
    default:
      return "Queued";
  }
}

function ConversionRow({
  item,
  index,
  onReview,
  onRetry,
  running,
}: {
  item: TrackConversion;
  index: number;
  onReview: (index: number) => void;
  onRetry: (index: number) => void;
  running: boolean;
}) {
  const target = selectedTrack(item);
  const candidate = item.match?.best;
  const state = item.state;

  return (
    <li className="border-b border-line/80 last:border-0">
      <div className="flex gap-2.5 py-3 sm:gap-3">
        <span className="w-5 shrink-0 pt-2 text-right font-mono text-[15px] leading-none text-faint">
          {String(index + 1).padStart(2, "0")}
        </span>
        <Cover src={item.source.artworkUrl} alt="" size={38} rounded="rounded-[12px]" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-medium leading-snug text-ink">
                {item.source.title}
              </p>
              <p className="truncate text-[15px] text-muted">
                {item.source.artists.map((artist) => artist.name).join(", ")}
                {item.source.durationMs ? (
                  <span className="tabular ml-1.5 font-mono text-[15px] text-faint">
                    {formatDuration(item.source.durationMs)}
                  </span>
                ) : null}
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-1 sm:flex">
              {state === "matching" ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-1 font-mono text-[15px] uppercase tracking-wider text-muted">
                  <Loader2 className="size-2.5 animate-spin" aria-hidden />
                  Matching
                </span>
              ) : state === "matched" || state === "uncertain" ? (
                <ConfidenceBadge confidence={candidate?.confidence ?? "low"} compact />
              ) : state === "failed" ? (
                <span
                  title={item.error?.message}
                  className="inline-flex items-center gap-1 rounded-full border border-danger/25 bg-danger-soft px-2 py-1 font-mono text-[15px] uppercase tracking-wider text-danger"
                >
                  <TriangleAlert className="size-2.5" aria-hidden />
                  Not found
                </span>
              ) : (
                <span className="font-mono text-[15px] uppercase tracking-wider text-faint">Queued</span>
              )}

              {target ? (
                <>
                  <button
                    type="button"
                    onClick={() => onReview(index)}
                    aria-label={`Review alternatives for ${item.source.title}`}
                    title="Review alternatives"
                    className="flex size-8 items-center justify-center rounded-full btn-ghost text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                  >
                    <ListFilter className="size-3.5" aria-hidden />
                  </button>
                  <a
                    href={target.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`Open ${target.title}`}
                    className="flex size-8 items-center justify-center rounded-full btn-ghost text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                  >
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </>
              ) : null}

              {state === "failed" && !running ? (
                <button
                  type="button"
                  onClick={() => onRetry(index)}
                  aria-label={`Retry ${item.source.title}`}
                  title="Retry this track"
                  className="flex size-8 items-center justify-center rounded-full btn-ghost text-faint transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
            <span aria-hidden className="font-mono text-[15px] text-faint">
              ↳
            </span>
            {state === "matching" ? (
              <span className="text-[15px] text-muted">Searching {platformLabel(item.match?.best?.track.platform ?? "youtube")}…</span>
            ) : target ? (
              <span className="min-w-0 truncate text-[15px] text-ink-2">
                {target.title}
                <span className="text-muted"> — {target.artists.map((a) => a.name).join(", ")}</span>
              </span>
            ) : state === "failed" ? (
              <span className="truncate text-[15px] text-danger/90">
                {item.error?.message ?? "No match found"}
              </span>
            ) : (
              <span className="text-[15px] text-faint">Not converted yet</span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 sm:hidden">
            {state === "matching" ? (
              <span className="font-mono text-[15px] uppercase tracking-wider text-muted">Matching…</span>
            ) : state === "matched" || state === "uncertain" ? (
              <ConfidenceBadge confidence={candidate?.confidence ?? "low"} compact />
            ) : state === "failed" ? (
              <span className="font-mono text-[15px] uppercase tracking-wider text-danger">Not found</span>
            ) : (
              <span className="font-mono text-[15px] uppercase tracking-wider text-faint">Queued</span>
            )}
            {target ? (
              <button
                type="button"
                onClick={() => onReview(index)}
                className="ml-auto inline-flex items-center gap-1 text-[15px] text-muted"
              >
                <ListFilter className="size-3" aria-hidden />
                Review
              </button>
            ) : null}
            {state === "failed" && !running ? (
              <button
                type="button"
                onClick={() => onRetry(index)}
                className="inline-flex items-center gap-1 text-[15px] text-muted"
              >
                <RefreshCw className="size-3" aria-hidden />
                Retry
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "danger" | "muted";
}) {
  return (
    <div className="rounded-[16px] border border-line bg-surface px-3 py-2">
      <p className="font-mono text-[15px] uppercase tracking-[0.12em] text-faint">{label}</p>
      <p
        className={cn(
          "tabular mt-0.5 font-display text-[22px] leading-none",
          tone === "ok" && "text-ok",
          tone === "warn" && "text-warn",
          tone === "danger" && "text-danger",
          tone === "muted" && "text-muted",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function CollectionWorkspace({
  expectedKind,
  initialUrl,
  initialCollection = null,
}: {
  expectedKind: CollectionKind;
  initialUrl?: string;
  initialCollection?: Collection | null;
}) {
  const toast = useToast();
  const { add } = useHistory();

  const [url, setUrl] = useState(initialUrl ?? "");
  const [collection, setCollection] = useState<Collection | null>(initialCollection);
  const [destination, setDestination] = useState<Platform>(
    initialCollection ? (initialCollection.platform === "spotify" ? "youtube" : "spotify") : "youtube",
  );
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  const [trackNotice, setTrackNotice] = useState<Track | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const autoResolved = useRef(false);
  const recordedKey = useRef<string>("");

  const conversion = useCollectionConversion(collection, destination);
  const { items, running, summary, progress } = conversion;

  const resolveUrl = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setResolving(true);
    setError(null);
    setTrackNotice(null);
    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const body = (await response.json()) as ResolveBody;

      if (!response.ok) {
        setError((body as { error: ApiErrorBody["error"] }).error);
        setCollection(null);
        return;
      }

      if ("kind" in body && body.kind === "track") {
        setTrackNotice(body.track);
        setCollection(null);
        return;
      }

      if ("collection" in body) {
        setCollection(body.collection);
        setDestination(body.collection.platform === "spotify" ? "youtube" : "spotify");
        setUrl(trimmed);
        recordedKey.current = "";
      }
    } catch {
      setError({
        code: "network",
        message: "We couldn't reach TuneShift.",
        hint: "Check your connection and try again.",
      });
    } finally {
      setResolving(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUrl || initialCollection || autoResolved.current) return;
    autoResolved.current = true;
    setUrl(initialUrl);
    void resolveUrl(initialUrl);
  }, [initialUrl, initialCollection, resolveUrl]);

  // Record the collection in local history once a run has settled.
  useEffect(() => {
    if (!collection || running) return;
    if (summary.total === 0 || summary.pending > 0) return;
    if (summary.matched + summary.uncertain + summary.failed === 0) return;

    const key = `${collection.id}:${summary.matched}:${summary.uncertain}:${summary.failed}`;
    if (recordedKey.current === key) return;
    recordedKey.current = key;

    add({
      sourceUrl: collection.url,
      sourcePlatform: collection.platform,
      destinationPlatform: destination,
      kind: collection.kind,
      title: collection.title,
      ...(collection.owner ? { subtitle: collection.owner } : {}),
      ...(collection.artworkUrl ? { artworkUrl: collection.artworkUrl } : {}),
      trackCount: summary.total,
      status:
        summary.failed === 0
          ? "completed"
          : summary.matched + summary.uncertain > 0
            ? "partial"
            : "failed",
      matchedCount: summary.matched,
      uncertainCount: summary.uncertain,
      failedCount: summary.failed,
    });
  }, [collection, destination, running, summary, add]);

  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  const done = summary.total - summary.pending;

  const handleExport = (format: ExportFormat) => {
    if (!collection) return;
    const { filename, mime, content } = exportConversions(items, format, {
      title: collection.title,
      sourcePlatform: platformLabel(collection.platform),
      destinationPlatform: platformLabel(destination),
    });
    downloadFile(filename, mime, content);
    toast.success(`Exported ${format.toUpperCase()}`, filename);
  };

  const copyAllLinks = async () => {
    const links = items
      .map((item) => selectedTrack(item)?.url)
      .filter((value): value is string => Boolean(value));
    if (links.length === 0) {
      toast.info("Nothing to copy yet", "Convert a few tracks first.");
      return;
    }
    const copied = await copyToClipboard(links.join("\n"));
    if (copied) toast.success(`${links.length} links copied`);
    else toast.error("Couldn't copy the links");
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      setUrl(text.trim());
    } catch {
      toast.error("Clipboard access was blocked", "Paste with Ctrl/Cmd + V.");
    }
  };

  return (
    <div className="space-y-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void resolveUrl(url);
        }}
        className="card p-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Input
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError(null);
              }}
              placeholder={
                expectedKind === "album"
                  ? "Paste a Spotify or YouTube Music album link"
                  : "Paste a Spotify or YouTube Music playlist link"
              }
              aria-label={`${expectedKind} link`}
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={paste}
              aria-label="Paste from clipboard"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full btn-ghost text-faint transition-colors duration-150 hover:text-ink"
            >
              <ClipboardPaste className="size-3.5" aria-hidden />
            </button>
          </div>
          <Button type="submit" disabled={resolving || url.trim().length === 0} className="h-11 px-5">
            {resolving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {resolving ? "Reading…" : "Load"}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 px-1">
          <p className="font-mono text-[15px] uppercase tracking-[0.1em] text-faint">
            public links only · no sign-in
          </p>
          <Link
            href={expectedKind === "album" ? "/playlists" : "/albums"}
            className="font-mono text-[15px] uppercase tracking-[0.1em] text-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
          >
            {expectedKind === "album" ? "Converting a playlist?" : "Converting an album?"}
          </Link>
        </div>
      </form>

      {error ? (
        <InlineNotice tone="danger" title={error.message}>
          <p>{error.hint ?? "The link couldn't be read."}</p>
          {error.code === "not_configured" ? (
            <Link href="/setup" className="mt-1 inline-block font-medium underline underline-offset-2">
              Open the setup guide
            </Link>
          ) : null}
        </InlineNotice>
      ) : null}

      {trackNotice ? (
        <InlineNotice tone="info" title="That's a single track, not a collection.">
          <p>
            {trackNotice.title} — {trackNotice.artists.map((artist) => artist.name).join(", ")}.
            Use the link converter to match it directly.
          </p>
          <Link
            href={`/convert?url=${encodeURIComponent(trackNotice.url)}`}
            className="mt-1.5 inline-flex items-center gap-1 font-medium text-pine underline underline-offset-2"
          >
            Convert this track
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </InlineNotice>
      ) : null}

      {resolving && !collection ? (
        <div className="card p-5">
          <div className="flex gap-4">
            <Skeleton className="size-[104px] rounded-[18px]" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-8 w-40 rounded-[14px]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-[14px]" />
            ))}
          </div>
        </div>
      ) : null}

      {collection ? (
        <>
          <div className="overflow-hidden card">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
              <Cover
                src={collection.artworkUrl}
                alt={`${collection.title} artwork`}
                size={112}
                rounded="rounded-[18px]"
                className="mx-auto sm:mx-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <PlatformChip platform={collection.platform} />
                  <span className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">
                    {collection.kind}
                    {collection.year ? ` · ${collection.year}` : ""}
                  </span>
                  {collection.truncated ? (
                    <span className="rounded-full border border-warn/25 bg-warn-soft px-2 py-0.5 font-mono text-[15px] uppercase tracking-wider text-warn">
                      first 200 tracks
                    </span>
                  ) : null}
                </div>
                <h2 className="display mt-2 text-[26px] leading-tight text-ink sm:text-[32px]">
                  {collection.title}
                </h2>
                <p className="mt-1 text-[15px] text-muted">
                  {collection.owner ? `${collection.owner} · ` : ""}
                  {formatCount(collection.trackCount)} tracks
                  {collection.unavailableCount
                    ? ` · ${collection.unavailableCount} unavailable in the API`
                    : ""}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => conversion.startAll()}
                    disabled={running}
                    className="h-9 px-3.5"
                  >
                    {running ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Sparkles className="size-3.5" aria-hidden />
                    )}
                    {running
                      ? `Matching ${done}/${summary.total}`
                      : summary.total > 0 && summary.pending === 0
                        ? "Re-run failed"
                        : `Convert ${summary.total} tracks`}
                  </Button>

                  {summary.failed > 0 && !running ? (
                    <Button variant="secondary" size="sm" onClick={conversion.retryFailed} className="h-9">
                      <RefreshCw className="size-3.5" aria-hidden />
                      Retry {summary.failed} failed
                    </Button>
                  ) : null}

                  {summary.pending < summary.total ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={conversion.reset}
                      disabled={running}
                      className="h-9"
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      Reset
                    </Button>
                  ) : null}

                  <a
                    href={collection.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full btn-ghost px-2.5 text-[15px] transition-colors duration-150 hover:text-ink"
                  >
                    Open source
                    <ArrowUpRight className="size-3" aria-hidden />
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-line bg-surface-2/40 px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <PlatformChip platform={collection.platform} size="sm" />
                  <span aria-hidden className="font-mono text-[15px] text-faint">
                    →
                  </span>
                  <PlatformChip platform={destination} size="sm" />
                  <span className="ml-1 font-mono text-[15px] uppercase tracking-[0.12em] text-faint">
                    order preserved
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={copyAllLinks}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full btn-ghost px-2 font-mono text-[15px] uppercase tracking-wider transition-colors duration-150 hover:text-ink"
                  >
                    <Copy className="size-3" aria-hidden />
                    Copy links
                  </button>
                  {(["txt", "csv", "json"] as ExportFormat[]).map((format) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleExport(format)}
                      className="inline-flex h-8 items-center gap-1 rounded-full btn-ghost px-2 font-mono text-[15px] uppercase tracking-wider transition-colors duration-150 hover:text-ink"
                    >
                      <Download className="size-2.5" aria-hidden />
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {summary.pending < summary.total ? (
            <div className="card p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <ProgressBar
                    value={progress}
                    label={`Converting to ${platformLabel(destination)}`}
                    detail={`${done} / ${summary.total}`}
                    active={running}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <SummaryStat label="Matched" value={summary.matched} tone="ok" />
                  <SummaryStat label="Review" value={summary.uncertain} tone="warn" />
                  <SummaryStat label="Not found" value={summary.failed} tone="danger" />
                </div>
              </div>
              <ShiftStrip
                value={progress}
                segments={64}
                height="sm"
                active={running}
                className="mt-3"
              />
              {running ? (
                <p className="mt-2 font-mono text-[15px] uppercase tracking-[0.12em] text-faint">
                  {conversion.activeCount} in flight · results appear as they land
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-hidden card">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
              <p className="label">Track list</p>
              <p className="font-mono text-[15px] uppercase tracking-[0.12em] text-faint">
                {summary.total} tracks
              </p>
            </div>
            <ul className="px-3 sm:px-4">
              {items.map((item, index) => (
                <ConversionRow
                  key={`${item.source.platform}:${item.source.id}`}
                  item={item}
                  index={index}
                  onReview={setActiveIndex}
                  onRetry={conversion.retryOne}
                  running={running}
                />
              ))}
            </ul>
          </div>

          <InlineNotice tone="info" title="Matched here — not saved to your library.">
            <p>
              TuneShift found and ranked every track, but writing a playlist into your personal
              Spotify or YouTube Music account requires OAuth permission that this deployment
              doesn&apos;t request. Export the list above, or open tracks individually. No account
              is needed for anything else.
            </p>
          </InlineNotice>
        </>
      ) : null}

      <Dialog
        open={activeItem !== null}
        onClose={() => setActiveIndex(null)}
        title="Choose a match"
        description={
          activeItem
            ? `${activeItem.source.title} — ${activeItem.source.artists[0]?.name ?? ""}`
            : undefined
        }
        size="md"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setActiveIndex(null)}>
            Done
          </Button>
        }
      >
        {activeItem ? (
          <MatchPanel
            source={activeItem.source}
            destination={destination}
            match={activeItem.match ?? null}
            loading={activeItem.state === "matching"}
            error={activeItem.error ?? null}
            onRetry={() => {
              if (activeIndex !== null) conversion.retryOne(activeIndex);
            }}
            onSelectionChange={(candidate: MatchCandidate | null) => {
              if (activeIndex === null || !candidate) return;
              const current = items[activeIndex]?.match?.best?.track.id;
              if (current !== candidate.track.id) conversion.select(activeIndex, candidate);
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
