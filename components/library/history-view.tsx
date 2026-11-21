"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, History, X } from "lucide-react";
import { useHistory } from "@/hooks/use-history";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/ui/cover";
import { PlatformChip } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { HistoryEntry } from "@/types/music";

const STATUS_LABEL: Record<HistoryEntry["status"], string> = {
  completed: "Completed",
  partial: "Partial",
  failed: "Failed",
};

const STATUS_TONE: Record<HistoryEntry["status"], string> = {
  completed: "border-ok/30 bg-ok-soft text-ok",
  partial: "border-warn/30 bg-warn-soft text-warn",
  failed: "border-danger/30 bg-danger-soft text-danger",
};

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const { remove } = useHistory();

  return (
    <li className="flex flex-wrap items-center gap-3 card p-3 sm:gap-4">
      <Cover src={entry.artworkUrl} alt={entry.title} size={48} rounded="rounded-[16px]" />
      <div className="min-w-0 flex-1 basis-52">
        <p className="truncate text-[16px] font-medium text-ink">{entry.title}</p>
        {entry.subtitle ? (
          <p className="mt-0.5 truncate text-[15px] text-muted">{entry.subtitle}</p>
        ) : null}
        <p className="mt-1 font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
          {formatRelativeTime(entry.createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <PlatformChip platform={entry.sourcePlatform} size="sm" withLabel={false} />
        <ArrowRight className="size-3 shrink-0 text-faint" aria-hidden />
        <PlatformChip platform={entry.destinationPlatform} size="sm" withLabel={false} />
      </div>

      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 font-mono text-[13px] uppercase tracking-[0.1em]",
            STATUS_TONE[entry.status],
          )}
        >
          {STATUS_LABEL[entry.status]}
        </span>
        <Link
          href={`/convert?url=${encodeURIComponent(entry.sourceUrl)}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-full btn-secondary px-3 text-[15px] font-medium transition-colors duration-150"
        >
          Convert
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => remove(entry.id)}
          aria-label={`Remove ${entry.title} from history`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full btn-ghost text-faint transition-colors duration-150 hover:text-danger"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

export function HistoryView() {
  const { entries, hydrated, clear } = useHistory();
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

  const visible = entries.slice(0, 50);

  return (
    <div className="container-page pt-8 pb-16 lg:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="label">Library</p>
          <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)] text-ink">History</h1>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted">
            Conversions you ran in this browser. Kept in local storage only - nothing ever leaves
            your device.
          </p>
        </div>
        {entries.length > 0 ? (
          <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
            Clear history
          </Button>
        ) : null}
      </header>

      {visible.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={History}
            title="Nothing here yet"
            description="When you convert a track, the attempt shows up here with the platforms it crossed."
          />
          <p className="mt-5 text-[15px] leading-relaxed text-muted">
            Ready when you are. Paste a link and the first conversion will show up here.
          </p>
          <Link
            href="/convert"
            className="mt-3 inline-flex h-11 items-center rounded-full btn-primary px-5 text-[16px] font-medium transition-[filter,box-shadow] duration-150"
          >
            Open the converter
          </Link>
        </div>
      ) : (
        <ul className="mt-7 space-y-2.5">
          {visible.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} />
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
        title="Clear history?"
        description="This removes the stored entries from this browser."
        confirmLabel="Clear history"
      />
    </div>
  );
}
