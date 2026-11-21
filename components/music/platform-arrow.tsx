import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import { PlatformChip } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { Platform } from "@/types/music";

export function PlatformArrow({
  from,
  to,
  className,
  compact = false,
}: {
  from: Platform;
  to: Platform;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PlatformChip platform={from} size={compact ? "sm" : "md"} />
      <ArrowRight className="size-3 shrink-0 text-faint" aria-label="to" />
      <PlatformChip platform={to} size={compact ? "sm" : "md"} />
    </div>
  );
}

export function MatchTooltip() {
  return (
    <span
      className="inline-flex size-4 items-center justify-center text-faint"
      title="Confidence comes from title, artist, album, duration and version comparison."
    >
      <CircleHelp className="size-3.5" aria-hidden />
      <span className="sr-only">
        Confidence comes from title, artist, album, duration and version comparison.
      </span>
    </span>
  );
}

export function LinkOut({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1">
      {children}
      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}
