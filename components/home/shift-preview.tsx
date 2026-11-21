import { cn } from "@/lib/utils/cn";

/**
 * Decorative "shift" diagram used on the home page. It is intentionally
 * abstract: no invented track data, no fake results.
 */
export function ShiftPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden card p-5",
        className,
      )}
      aria-hidden
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-52 rounded-full opacity-[0.16] blur-2xl"
        style={{ background: "radial-gradient(circle, var(--saffron), transparent 70%)" }}
      />

      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[15px] uppercase tracking-[0.18em] text-faint">
          The shift
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1 rounded-full bg-faint" />
          <span className="size-1 rounded-full bg-faint/60" />
          <span className="size-1 rounded-full bg-faint/30" />
        </span>
      </div>

      <div className="relative mt-4 space-y-2.5">
        <div className="flex items-center gap-3 rounded-[18px] border border-line bg-paper/60 p-2.5">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-[12px] bg-surface-3">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,var(--line-strong),var(--surface-2))]" />
            <div className="absolute inset-0 m-auto size-5 rounded-full border border-paper/40" />
            <div className="absolute inset-0 m-auto size-1.5 rounded-full bg-paper/60" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2 w-[62%] rounded-full bg-line-strong/70" />
            <div className="h-1.5 w-[38%] rounded-full bg-line" />
          </div>
          <span className="flex items-center gap-1 rounded-full border border-line px-2 py-1 font-mono text-[15px] uppercase tracking-wider text-muted">
            <span className="size-1.5 rounded-full bg-spotify" />
            Spotify
          </span>
        </div>

        <div className="flex items-center gap-2 pl-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface shadow-xs">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 6h10M10 3l3 3-3 3M13 10H3M6 7l-3 3 3 3" stroke="var(--muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--pine)_0_4px,transparent_4px_8px)]" />
          <span className="font-mono text-[15px] uppercase tracking-[0.16em] text-faint">
            duration · version · album
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[18px] border border-pine/25 bg-pine/[0.05] p-2.5 dark:bg-pine/[0.07]">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-[12px] bg-surface-3">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,var(--saffron-soft),var(--surface-2))]" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-saffron/50" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-2 w-[68%] rounded-full bg-pine/40" />
            <div className="h-1.5 w-[44%] rounded-full bg-line-strong/60" />
          </div>
          <span className="flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 font-mono text-[15px] uppercase tracking-wider text-muted">
            <span className="size-1.5 rounded-full bg-youtube" />
            YT Music
          </span>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between rounded-[16px] border border-line bg-surface-2/70 px-3 py-2">
        <span className="font-mono text-[15px] uppercase tracking-[0.14em] text-muted">
          Studio · 3:22
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[15px] uppercase tracking-[0.14em] text-ok">
          <span className="flex items-end gap-[2px]">
            <span className="h-1 w-[2px] rounded-full bg-current" />
            <span className="h-2 w-[2px] rounded-full bg-current" />
            <span className="h-2.5 w-[2px] rounded-full bg-current" />
            <span className="h-1.5 w-[2px] rounded-full bg-current" />
          </span>
          excellent match
        </span>
      </div>
    </div>
  );
}
