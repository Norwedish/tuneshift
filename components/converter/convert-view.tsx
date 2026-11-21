"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ClipboardPaste,
  Link2,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/empty-state";
import { PlatformChip, ConfidenceBadge } from "@/components/ui/badge";
import { ShiftStrip } from "@/components/ui/shift-strip";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchPanel } from "@/components/converter/match-panel";
import { CollectionWorkspace } from "@/components/collection/collection-workspace";
import { useToast } from "@/components/providers/toast-provider";
import { useHistory } from "@/hooks/use-history";
import { parseMusicLink } from "@/lib/validation/links";
import { platformLabel } from "@/lib/utils/platform";
import { cn } from "@/lib/utils/cn";
import type { ApiErrorBody, ResolveResponse } from "@/types/api";
import type { MatchCandidate, MatchResult, Platform, Track } from "@/types/music";

type Resolved = Extract<ResolveResponse, { kind: "track" }> | Extract<ResolveResponse, { kind: "album" | "playlist" }>;

const STEPS = [
  { index: "01", title: "Paste a link", body: "Song, album or playlist from either platform." },
  { index: "02", title: "We read the metadata", body: "Artwork, artists, album, duration, version." },
  { index: "03", title: "Rank and review", body: "Best match first, alternatives one click away." },
];

export function ConvertView() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { add } = useHistory();

  const initialUrl = params.get("url") ?? "";
  const [value, setValue] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorBody["error"] | null>(null);
  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [selection, setSelection] = useState<MatchCandidate | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const recorded = useRef<string>("");
  const autoRan = useRef(false);

  const detection = value.trim().length > 8 ? parseMusicLink(value) : null;

  const run = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const parsed = parseMusicLink(trimmed);
    if (!parsed.ok) {
      setInlineError(parsed.message);
      setError(null);
      return;
    }
    setInlineError(null);
    setLoading(true);
    setError(null);
    setResolved(null);
    setSelection(null);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const body = (await response.json()) as Resolved | { error: ApiErrorBody["error"] };
      if (!response.ok) {
        setError((body as { error: ApiErrorBody["error"] }).error);
        return;
      }
      setResolved(body as Resolved);
    } catch {
      setError({
        code: "network",
        message: "We couldn't reach TuneShift.",
        hint: "Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUrl || autoRan.current) return;
    autoRan.current = true;
    void run(initialUrl);
  }, [initialUrl, run]);

  const trackResult = resolved && resolved.kind === "track" ? resolved : null;
  const collectionResult =
    resolved && (resolved.kind === "album" || resolved.kind === "playlist") ? resolved : null;

  // Save a link conversion to local history once a match is on screen.
  useEffect(() => {
    if (!trackResult) return;
    const candidate = selection ?? trackResult.match.best;
    if (!candidate) return;
    const key = `${trackResult.track.id}->${candidate.track.id}`;
    if (recorded.current === key) return;
    recorded.current = key;
    add({
      sourceUrl: trackResult.track.url,
      sourcePlatform: trackResult.sourcePlatform,
      destinationPlatform: candidate.track.platform,
      kind: "track",
      title: trackResult.track.title,
      subtitle: trackResult.track.artists.map((artist) => artist.name).join(", "),
      ...(trackResult.track.artworkUrl ? { artworkUrl: trackResult.track.artworkUrl } : {}),
      status: candidate.confidence === "low" ? "partial" : "completed",
      destinationUrl: candidate.track.url,
      destinationTitle: candidate.track.title,
      confidence: candidate.confidence,
    });
  }, [trackResult, selection, add]);

  const reset = () => {
    setResolved(null);
    setSelection(null);
    setError(null);
    setInlineError(null);
    recorded.current = "";
    router.replace("/convert");
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      setValue(text.trim());
      setInlineError(null);
    } catch {
      toast.error("Clipboard access was blocked", "Paste with Ctrl/Cmd + V.");
    }
  };

  return (
    <div className="container-page mt-6 space-y-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(value);
        }}
        className={cn(
          "card p-2 transition-colors",
          inlineError ? "border-danger/40" : "border-line-strong focus-within:border-glow/50",
        )}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex flex-1 items-center">
            <Link2 className="pointer-events-none absolute left-3.5 size-4 text-muted" aria-hidden />
            <Input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setInlineError(null);
                setError(null);
              }}
              placeholder="https://open.spotify.com/track/…  or  music.youtube.com/watch?v=…"
              aria-label="Music link"
              aria-invalid={Boolean(inlineError)}
              className="h-12 border-0 bg-transparent pl-10 pr-24 text-[15px] shadow-none focus:ring-0"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={paste}
                aria-label="Paste from clipboard"
                className="flex size-8 items-center justify-center rounded-[12px] text-faint transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <ClipboardPaste className="size-3.5" aria-hidden />
              </button>
              {detection?.ok ? (
                <PlatformChip platform={detection.platform} size="sm" />
              ) : null}
            </div>
          </div>

          <Button type="submit" disabled={loading || value.trim().length === 0} className="h-12 px-5">
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {loading ? "Reading link…" : "Convert"}
          </Button>
        </div>
      </form>

      {inlineError ? (
        <p role="alert" className="px-1 text-[15px] text-danger">
          {inlineError}
        </p>
      ) : null}

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

      {loading ? (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <span className="label">Resolving link</span>
            <span className="font-mono text-[15px] text-faint">reading metadata…</span>
          </div>
          <ShiftStrip segments={56} height="sm" active value={1} className="mt-3 opacity-70" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-20 w-full rounded-[18px]" />
            <Skeleton className="h-28 w-full rounded-[18px]" />
          </div>
        </div>
      ) : null}

      {trackResult ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="card p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PlatformChip platform={trackResult.sourcePlatform} />
                <ArrowRight className="size-3 text-faint" aria-hidden />
                <PlatformChip platform={trackResult.destinationPlatform} />
              </div>
              <div className="flex items-center gap-2">
                {trackResult.match.best ? (
                  <ConfidenceBadge confidence={trackResult.match.confidence} />
                ) : null}
                <Button variant="ghost" size="sm" onClick={reset} className="h-8">
                  <RotateCcw className="size-3.5" aria-hidden />
                  New link
                </Button>
              </div>
            </div>

            <MatchPanel
              source={trackResult.track}
              destination={trackResult.destinationPlatform}
              match={trackResult.match}
              loading={false}
              error={null}
              onRetry={() => void run(value)}
              onSelectionChange={setSelection}
            />
          </div>

          <aside className="space-y-3">
            <div className="card p-4">
              <p className="label">What happened</p>
              <ol className="mt-3 space-y-3">
                {[
                  `Read the ${platformLabel(trackResult.sourcePlatform)} metadata.`,
                  `Searched ${platformLabel(trackResult.destinationPlatform)} with title, artist and version.`,
                  `${trackResult.match.candidates.length} candidate${
                    trackResult.match.candidates.length === 1 ? "" : "s"
                  } scored; the best is recommended.`,
                ].map((line, index) => (
                  <li key={line} className="flex gap-2.5">
                    <span className="mt-0.5 font-mono text-[15px] tracking-wider text-pine">
                      0{index + 1}
                    </span>
                    <span className="text-[15px] leading-relaxed text-muted">{line}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-[20px] border border-line bg-surface-2/50 p-4">
              <p className="flex items-center gap-1.5 text-[15px] font-medium text-ink">
                <Lock className="size-3 text-faint" aria-hidden />
                Private to your browser
              </p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                This conversion was added to your local history. Nothing was uploaded to an account.
              </p>
              <Link
                href="/history"
                className="mt-2 inline-flex items-center gap-1 text-[15px] font-medium text-pine hover:underline"
              >
                View history
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </div>

            <div className="card p-4">
              <p className="label">Not the right version?</p>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                Open the alternatives under the recommendation. TuneShift distinguishes live,
                remix, acoustic and sped-up versions rather than treating them as the same track.
              </p>
            </div>
          </aside>
        </div>
      ) : null}

      {collectionResult ? (
        <div>
          <InlineNotice
            tone="info"
            title={`That link is a full ${collectionResult.kind}, so it opened the ${collectionResult.kind} workspace.`}
          >
            <p>
              Every track is matched individually, in order, with per-track review and export.
            </p>
          </InlineNotice>
          <div className="mt-4">
            <CollectionWorkspace
              expectedKind={collectionResult.kind}
              initialCollection={collectionResult.collection}
              initialUrl={value}
            />
          </div>
        </div>
      ) : null}

      {!resolved && !loading ? (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card p-5 sm:p-6">
            <p className="label">How the converter works</p>
            <ol className="mt-4 space-y-4">
              {STEPS.map((step) => (
                <li key={step.index} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 font-mono text-[15px] text-muted">
                    {step.index}
                  </span>
                  <div>
                    <p className="text-[15px] font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[26px] border border-line bg-surface-2/40 p-5">
            <p className="label">Supported links</p>
            <div className="mt-3 space-y-3">
              <div>
                <PlatformChip platform="spotify" />
                <ul className="mt-2 space-y-1.5">
                  {[
                    "open.spotify.com/track/…",
                    "open.spotify.com/album/…",
                    "open.spotify.com/playlist/…",
                    "spotify:track:…",
                  ].map((item) => (
                    <li key={item} className="font-mono text-[15px] text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rule" />
              <div>
                <PlatformChip platform="youtube" />
                <ul className="mt-2 space-y-1.5">
                  {[
                    "music.youtube.com/watch?v=…",
                    "music.youtube.com/playlist?list=…",
                    "youtube.com/watch?v=…",
                    "youtu.be/…",
                  ].map((item) => (
                    <li key={item} className="font-mono text-[15px] text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-faint">
              Only these hosts are read. TuneShift extracts the ID and calls the official API — it
              never fetches an arbitrary URL.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
