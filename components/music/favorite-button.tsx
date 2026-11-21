"use client";

import { Heart } from "lucide-react";
import { useFavorites, favoriteId } from "@/hooks/use-favorites";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils/cn";
import type { FavoriteEntry } from "@/types/music";

export function FavoriteButton({
  entry,
  className,
  size = "md",
}: {
  entry: Omit<FavoriteEntry, "addedAt">;
  className?: string;
  size?: "sm" | "md";
}) {
  const { toggle, isFavorite, hydrated } = useFavorites();
  const toast = useToast();
  const active = hydrated && isFavorite(entry.id);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${entry.title} from favorites` : `Save ${entry.title} to favorites`}
      onClick={(event) => {
        event.stopPropagation();
        const added = toggle(entry);
        toast.success(
          added ? "Saved to favorites" : "Removed from favorites",
          added ? entry.title : undefined,
        );
      }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[12px] text-faint transition-colors hover:bg-surface-2",
        size === "sm" ? "size-7" : "size-8",
        active && "text-danger",
        className,
      )}
    >
      <Heart className={cn("size-3.5", active && "fill-current")} aria-hidden />
    </button>
  );
}

export function favoriteForTrack(track: {
  id: string;
  platform: "spotify" | "youtube";
  title: string;
  artists: Array<{ name: string }>;
  artworkUrl?: string;
  url: string;
  durationMs?: number;
}): Omit<FavoriteEntry, "addedAt"> {
  return {
    id: favoriteId(track.platform, "track", track.id),
    platform: track.platform,
    kind: "track",
    title: track.title,
    subtitle: track.artists.map((artist) => artist.name).join(", "),
    ...(track.artworkUrl ? { artworkUrl: track.artworkUrl } : {}),
    url: track.url,
    ...(track.durationMs ? { durationMs: track.durationMs } : {}),
  };
}
