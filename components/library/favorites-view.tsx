"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { EmptyState } from "@/components/ui/empty-state";
import { Cover } from "@/components/ui/cover";
import { PlatformChip } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/utils/format";
import { platformLabel } from "@/lib/utils/platform";
import type { FavoriteEntry } from "@/types/music";

function FavoriteRow({ entry }: { entry: FavoriteEntry }) {
  const { remove } = useFavorites();

  return (
    <li className="flex flex-wrap items-center gap-3 card p-3 sm:gap-4">
      <Cover src={entry.artworkUrl} alt={entry.title} size={48} rounded="rounded-[16px]" />
      <div className="min-w-0 flex-1 basis-52">
        <p className="truncate text-[16px] font-medium text-ink">{entry.title}</p>
        {entry.subtitle ? (
          <p className="mt-0.5 truncate text-[15px] text-muted">{entry.subtitle}</p>
        ) : null}
        <p className="mt-1 font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
          {formatRelativeTime(entry.addedAt)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <PlatformChip platform={entry.platform} size="sm" withLabel={false} />
        <span className="font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
          {platformLabel(entry.platform)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`/convert?url=${encodeURIComponent(entry.url)}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full btn-secondary px-3 text-[15px] font-medium transition-colors duration-150"
        >
          Convert
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => remove(entry.id)}
          aria-label={`Remove ${entry.title} from favorites`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full btn-ghost text-faint transition-colors duration-150 hover:text-danger"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function FavoritesView() {
  const { favorites, hydrated, clear } = useFavorites();
  const [confirming, setConfirming] = useState(false);

  if (!hydrated) {
    return (
      <div className="container-page pt-8 lg:pt-12">
        <div className="h-8 w-40 animate-pulse rounded-full bg-surface-2" />
        <div className="mt-7 space-y-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-[20px] border border-line bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  const visible = favorites.slice(0, 50);

  return (
    <div className="container-page pt-8 pb-16 lg:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="label">Library</p>
          <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)] text-ink">Favorites</h1>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted">
            Tracks you saved while browsing. Stored in this browser only.
          </p>
        </div>
        {favorites.length > 0 ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex h-9 items-center rounded-full btn-secondary px-3 text-[15px] font-medium transition-colors duration-150"
          >
            Clear favorites
          </button>
        ) : null}
      </header>

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Tap the heart on any track to keep it here for the conversion you&apos;ll want to run later."
          />
          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            Favorites stay in your browser - nothing is ever uploaded.
          </p>
        </div>
      ) : (
        <ul className="mt-7 space-y-2.5">
          {visible.map((entry) => (
            <FavoriteRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          clear();
          setConfirming(false);
        }}
        title="Clear favorites?"
        description="This removes the stored favorites from this browser."
        confirmLabel="Clear favorites"
      />
    </div>
  );
}
