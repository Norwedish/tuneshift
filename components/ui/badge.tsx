import { cn } from "@/lib/utils/cn";
import type { Confidence, Platform } from "@/types/music";

export function PlatformChip({
  platform,
  size = "md",
  withLabel = true,
  className,
}: {
  platform: Platform;
  size?: "sm" | "md";
  withLabel?: boolean;
  className?: string;
}) {
  const isSpotify = platform === "spotify";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 font-mono uppercase tracking-[0.1em] text-muted",
        size === "sm" ? "px-2 py-[3px] text-[15px]" : "px-2.5 py-1 text-[15px]",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn("size-1.5 rounded-full", isSpotify ? "bg-spotify" : "bg-youtube")}
      />
      {withLabel ? (isSpotify ? "Spotify" : "YouTube Music") : null}
    </span>
  );
}

const CONFIDENCE_META: Record<
  Confidence,
  { label: string; short: string; tone: string; bars: number }
> = {
  excellent: { label: "Excellent match", short: "Excellent", tone: "text-ok bg-ok-soft border-ok/25", bars: 4 },
  good: { label: "Good match", short: "Good", tone: "text-ok bg-ok-soft border-ok/20", bars: 3 },
  possible: { label: "Possible match", short: "Possible", tone: "text-warn bg-warn-soft border-warn/25", bars: 2 },
  low: { label: "Weak match", short: "Weak", tone: "text-danger bg-danger-soft border-danger/25", bars: 1 },
};

export function ConfidenceBadge({
  confidence,
  className,
  compact = false,
}: {
  confidence: Confidence;
  className?: string;
  compact?: boolean;
}) {
  const meta = CONFIDENCE_META[confidence];
  return (
    <span
      title={meta.label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[15px] uppercase tracking-[0.1em]",
        compact ? "px-1.5 py-0.5 text-[15px]" : "px-2.5",
        meta.tone,
        className,
      )}
    >
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "w-[2px] rounded-full bg-current",
              index < meta.bars ? "opacity-100" : "opacity-25",
            )}
            style={{ height: 4 + index * 1.6 }}
          />
        ))}
      </span>
      {compact ? meta.short : meta.label}
    </span>
  );
}

export function StatusDot({
  tone = "muted",
  pulse = false,
  className,
}: {
  tone?: "ok" | "warn" | "danger" | "muted";
  pulse?: boolean;
  className?: string;
}) {
  const toneClass = {
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger",
    muted: "bg-faint",
  }[tone];
  const toneBg = {
    ok: "bg-ok/20",
    warn: "bg-warn/20",
    danger: "bg-danger/20",
    muted: "bg-faint/20",
  }[tone];

  return (
    <span className={cn("relative flex size-2 shrink-0", className)} aria-hidden>
      {pulse ? (
        <span className={cn("absolute inset-0 animate-ping rounded-full", toneBg)} />
      ) : null}
      <span className={cn("relative size-2 rounded-full", toneClass)} />
    </span>
  );
}
