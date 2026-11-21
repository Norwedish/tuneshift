"use client";

import { ArrowUpRight, Play } from "lucide-react";
import { Cover } from "@/components/ui/cover";
import { PlatformChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton, favoriteForTrack } from "@/components/music/favorite-button";
import { formatDuration } from "@/lib/conversion/summary";
import { platformLabel } from "@/lib/utils/platform";
import { cn } from "@/lib/utils/cn";
import type { Track } from "@/types/music";

export function TrackRow({
  track,
  onConvert,
  active = false,
  index,
}: {
  track: Track;
  onConvert: (track: Track) => void;
  active?: boolean;
  index: number;
}) {
  const meta = [
    track.artists.map((artist) => artist.name).join(", "),
    track.album?.name,
    track.year && !track.album?.name ? String(track.year) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn(
        "group relative flex items-center gap-3 rounded-[20px] border bg-surface p-2.5 pr-2.5 transition-all duration-200 sm:gap-3.5 sm:p-3 sm:pr-3.5",
        active
          ? "border-pine/40 shadow-sm ring-1 ring-pine/15"
          : "border-line hover:border-line-strong hover:shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={() => onConvert(track)}
        aria-label={`Review conversion for ${track.title}`}
        className="group/cover sheen relative shrink-0 overflow-hidden rounded-[14px]"
      >
        <Cover src={track.artworkUrl} alt={`${track.title} artwork`} size={52} rounded="rounded-[14px]" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 dark:bg-black/62 opacity-0 transition-opacity duration-200 group-hover/cover:opacity-100">
          <Play className="size-4 fill-white text-white" aria-hidden />
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15.5px] font-medium leading-snug text-ink">{track.title}</h3>
        <p className="mt-0.5 truncate text-[15px] text-muted">{meta || "Unknown artist"}</p>
        <div className="mt-1.5 flex items-center gap-2 sm:hidden">
          <PlatformChip platform={track.platform} size="sm" />
          {track.durationMs ? (
            <span className="tabular font-mono text-[15px] text-faint">
              {formatDuration(track.durationMs)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="hidden w-[104px] shrink-0 flex-col items-end gap-1 sm:flex">
        <PlatformChip platform={track.platform} size="sm" />
        <span className="tabular font-mono text-[15px] text-faint">
          {formatDuration(track.durationMs)}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <FavoriteButton entry={favoriteForTrack(track)} size="sm" />
        <a
          href={track.url}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Open ${track.title} on ${platformLabel(track.platform)}`}
          className="hidden size-7 items-center justify-center rounded-[12px] text-faint transition-colors hover:bg-surface-2 hover:text-ink sm:flex"
        >
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onConvert(track)}
          className="ml-1 h-8 px-2.5 text-[15px]"
        >
          Convert
        </Button>
      </div>
    </article>
  );
}

