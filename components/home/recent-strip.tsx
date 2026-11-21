"use client";

import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";
import { useHistory } from "@/hooks/use-history";
import { Cover } from "@/components/ui/cover";
import { PlatformChip } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/format";

export function RecentStrip() {
  const { entries, hydrated } = useHistory();

  if (!hydrated) return null;
  if (entries.length === 0) return null;

  const recent = entries.slice(0, 4);

  return (
    <section className="container-page mt-12">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="size-3.5 text-faint" aria-hidden />
          <h2 className="label">Recent in this browser</h2>
        </div>
        <Link
          href="/history"
          className="font-mono text-[15px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {recent.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center gap-3 card p-2.5"
          >
            <Cover src={entry.artworkUrl} alt={entry.title} size={40} rounded="rounded-[12px]" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-medium text-ink">{entry.title}</p>
              <p className="mt-0.5 truncate text-[15px] text-muted">
                {entry.subtitle ?? `${entry.kind} · ${formatRelativeTime(entry.createdAt)}`}
              </p>
            </div>
            <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
              <PlatformChip platform={entry.sourcePlatform} size="sm" withLabel={false} />
              <span className="font-mono text-[14px] uppercase tracking-[0.1em] text-faint">
                {entry.status === "failed" ? "failed" : entry.status === "partial" ? "partial" : "done"}
              </span>
            </div>
            {entry.destinationUrl ? (
              <a
                href={entry.destinationUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${entry.title} on the destination platform`}
                className="shrink-0 rounded-md p-1.5 text-faint transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <ArrowUpRight className="size-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
