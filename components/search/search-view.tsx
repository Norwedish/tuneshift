"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Compass,
  Music4,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState, InlineNotice } from "@/components/ui/empty-state";
import { TrackListSkeleton } from "@/components/ui/skeleton";
import { TrackRow } from "@/components/music/track-row";
import { ConvertTrackDialog } from "@/components/converter/convert-track-dialog";
import { useSearchHistory } from "@/hooks/use-search-history";
import { useProviderStatus } from "@/components/providers/status-provider";
import { otherPlatform, platformLabel } from "@/lib/utils/platform";
import { cn } from "@/lib/utils/cn";
import type { SearchResponse } from "@/types/api";
import type { Platform, Track } from "@/types/music";

type Filter = "all" | Platform;

const EXAMPLES = ["Blinding Lights", "The Weeknd", "Daft Punk Instant Crush"];

export function SearchView() {
  const params = useSearchParams();
  const router = useRouter();
  const query = (params.get("q") ?? "").trim();

  const [input, setInput] = useState(query);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Track | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRemembered = useRef<string>("");
  const { searches, remember } = useSearchHistory();
  const { status } = useProviderStatus();

  useEffect(() => {
    setInput(query);
  }, [query]);

  // Debounced URL sync: typing feels instant, requests stay cheap.
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = input.trim();
      if (next === query) return;
      if (next.length === 0) {
        router.replace("/search");
        return;
      }
      if (next.length < 2) return;
      router.replace(`/search?q=${encodeURIComponent(next)}`);
    }, 380);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    if (query.length < 2) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const body = (await response.json()) as SearchResponse & {
          error?: { message: string };
        };
        if (!response.ok) throw new Error(body.error?.message ?? "Search failed");
        if (cancelled) return;
        setData(body);
        if (lastRemembered.current !== query) {
          lastRemembered.current = query;
          remember(query);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Search failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // "/" focuses search from anywhere on the page.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (event.key === "Escape" && target === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const results = data?.results ?? [];
  const spotifyCount = results.filter((track) => track.platform === "spotify").length;
  const youtubeCount = results.filter((track) => track.platform === "youtube").length;
  const visible = filter === "all" ? results : results.filter((track) => track.platform === filter);
  const errors = data?.errors ?? {};

  const onConvert = useCallback((track: Track) => setSelected(track), []);

  const allUnconfigured =
    status?.providers.spotify.configured === false && status?.providers.youtube.configured === false;

  return (
    <>
      <header className="container-page pt-8 lg:pt-12">
        <p className="flex items-center gap-2 font-mono text-[15px] uppercase tracking-[0.18em] text-muted">
          <span aria-hidden className="inline-block size-1.5 rotate-45 bg-saffron" />
          Search both catalogues
        </p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="display text-[clamp(2rem,5vw,3.1rem)] text-ink">
              {query ? (
                <>
                  Results for <span className="italic text-pine">“{query}”</span>
                </>
              ) : (
                <>
                  Find it <span className="italic text-pine">once.</span>
                </>
              )}
            </h1>
            <p className="mt-2 text-[15px] text-muted">
              {query
                ? `${results.length} ${results.length === 1 ? "result" : "results"} from Spotify and YouTube Music, interleaved.`
                : "Search a title, an artist, or both. Partial words work."}
            </p>
          </div>

          <div className="flex w-full items-center gap-2 lg:w-auto">
            <div className="relative flex-1 lg:w-[320px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
                aria-hidden
              />
              <Input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Search or paste a link"
                aria-label="Search music"
                className="h-10 pl-9 text-[15px]"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const next = input.trim();
                    if (next.length >= 2) {
                      remember(next);
                      router.replace(`/search?q=${encodeURIComponent(next)}`);
                    }
                  }
                }}
              />
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface-2 px-1.5 font-mono text-[13px] text-faint sm:block">
                /
              </kbd>
            </div>
          </div>
        </div>
        <div className="mt-6 rule" />
      </header>

      <div className="container-page mt-5">
        {query.length >= 2 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented<Filter>
              ariaLabel="Filter results by platform"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All sources", count: results.length },
                { value: "spotify", label: "Spotify", count: spotifyCount },
                { value: "youtube", label: "YouTube Music", count: youtubeCount },
              ]}
            />
            <span className="hidden items-center gap-1.5 font-mono text-[15px] uppercase tracking-[0.12em] text-faint sm:flex">
              <SlidersHorizontal className="size-3" aria-hidden />
              ranked per platform · not by TuneShift score
            </span>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {errors.spotify && filter !== "youtube" ? (
            <InlineNotice
              tone="warn"
              title={`Spotify: ${errors.spotify.message}`}
              action={
                <Link
                  href="/setup"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  Setup
                  <ArrowUpRight className="size-3" aria-hidden />
                </Link>
              }
            >
              {errors.spotify.hint ?? "Spotify results are unavailable right now."}
            </InlineNotice>
          ) : null}
          {errors.youtube && filter !== "spotify" ? (
            <InlineNotice
              tone="warn"
              title={`YouTube Music: ${errors.youtube.message}`}
              action={
                <Link
                  href="/setup"
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  Setup
                  <ArrowUpRight className="size-3" aria-hidden />
                </Link>
              }
            >
              {errors.youtube.hint ?? "YouTube results are unavailable right now."}
            </InlineNotice>
          ) : null}

          {error ? (
            <InlineNotice tone="danger" title="Search failed">
              {error} — check your connection and try again.
            </InlineNotice>
          ) : null}

          {loading ? <TrackListSkeleton count={6} /> : null}

          {!loading && query.length >= 2 && visible.length > 0 ? (
            <div className="space-y-2">
              {visible.map((track, index) => (
                <TrackRow
                  key={`${track.platform}:${track.id}`}
                  track={track}
                  index={index}
                  onConvert={onConvert}
                />
              ))}
            </div>
          ) : null}

          {!loading && query.length >= 2 && visible.length === 0 && !error ? (
            allUnconfigured ? (
              <EmptyState
                icon={Music4}
                title="No live catalogue connected"
                description="Add your Spotify and YouTube Data API credentials to start searching real music. TuneShift never shows placeholder results."
                action={
                  <Link
                    href="/setup"
                    className="inline-flex h-10 items-center gap-2 rounded-full btn-primary px-4 text-[15px] font-medium transition-[filter,box-shadow] duration-150"
                  >
                    Open the setup guide
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={SearchX}
                title="Nothing matched that"
                description={`No results for “${query}” in the catalogues we can reach. Try fewer words, check the spelling, or paste a direct link.`}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link
                      href="/convert"
                      className="inline-flex h-9 items-center gap-1.5 rounded-full btn-secondary px-3 text-[15px] font-medium"
                    >
                      Paste a link instead
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setInput("");
                        inputRef.current?.focus();
                      }}
                      className="inline-flex h-9 items-center gap-1.5 rounded-full btn-secondary px-3 text-[15px] font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                }
              />
            )
          ) : null}

          {!loading && query.length < 2 ? (
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="card p-5 sm:p-6">
                <p className="label">Start here</p>
                <h2 className="display mt-1.5 text-[24px] text-ink">
                  Two catalogues. One query.
                </h2>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
                  Type at least two characters. Results arrive from both platforms at once and are
                  interleaved so neither dominates.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => router.replace(`/search?q=${encodeURIComponent(example)}`)}
                      className="inline-flex items-center gap-1.5 rounded-full btn-secondary px-3 py-1.5 text-[15px] text-muted transition-colors duration-150 hover:text-ink"
                    >
                      <Sparkles className="size-3 text-pine" aria-hidden />
                      {example}
                    </button>
                  ))}
                </div>

                {searches.length > 0 ? (
                  <div className="mt-6 border-t border-line pt-4">
                    <div className="flex items-center justify-between">
                      <p className="label">Recent searches</p>
                      <Clock3 className="size-3 text-faint" aria-hidden />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {searches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => router.replace(`/search?q=${encodeURIComponent(item)}`)}
                          className="rounded-full btn-secondary px-2 py-1 text-[15px] text-ink-2 transition-colors duration-150"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="card p-5">
                <Compass className="size-4 text-pine" aria-hidden />
                <h3 className="display mt-3 text-[20px] text-ink">What gets compared</h3>
                <ul className="mt-3 space-y-2.5">
                  {[
                    "Title similarity, after stripping upload noise",
                    "All credited artists, not just the primary",
                    "Album title and release year",
                    "Duration, within a few seconds",
                    "Live / remix / acoustic / speed variants",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[15px] text-muted">
                      <span aria-hidden className="mt-1.5 size-1 shrink-0 rotate-45 bg-saffron" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ConvertTrackDialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        source={selected}
        destination={selected ? otherPlatform(selected.platform) : "youtube"}
      />

      {loading ? (
        <span className="sr-only" role="status">
          Searching {platformLabel("spotify")} and {platformLabel("youtube")}
        </span>
      ) : null}
    </>
  );
}

export function SearchViewFallback() {
  return (
    <div className={cn("container-page pt-10")}>
      <div className="h-10 w-2/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-surface-2" />
      <div className="mt-8 space-y-2">
        <TrackListSkeleton count={6} />
      </div>
    </div>
  );
}
