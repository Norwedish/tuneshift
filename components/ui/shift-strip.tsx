import { cn } from "@/lib/utils/cn";

function tickHeight(index: number, segments: number): number {
  const wave = Math.sin((index / Math.max(segments - 1, 1)) * Math.PI);
  const jitter = ((index * 7) % 5) - 2;
  return Math.round(5 + wave * 7 + jitter * 0.8);
}

/**
 * The TuneShift signature: a segmented tick rail that fills as work counts up.
 * Also used as a decorative divider, which keeps the motif consistent.
 */
export function ShiftStrip({
  value = 0,
  segments = 40,
  className,
  active = false,
  tone = "pine",
  height = "md",
}: {
  value?: number;
  segments?: number;
  className?: string;
  active?: boolean;
  tone?: "pine" | "saffron" | "muted";
  height?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * segments);
  const scale = height === "sm" ? 0.6 : height === "lg" ? 1.35 : 1;

  return (
    <div
      aria-hidden
      className={cn("flex w-full items-end gap-[3px]", className)}
      style={{ height: 20 * scale }}
    >
      {Array.from({ length: segments }, (_, index) => {
        const isFilled = index < filled;
        return (
          <span
            key={index}
            className={cn(
              "flex-1 rounded-full transition-colors duration-300",
              isFilled
                ? tone === "saffron"
                  ? "bg-saffron"
                  : tone === "muted"
                    ? "bg-faint"
                    : "bg-pine"
                : "bg-line",
              active && isFilled && "animate-[pulse-soft_1.6s_ease-in-out_infinite]",
            )}
            style={{
              height: tickHeight(index, segments) * scale,
              animationDelay: active ? `${(index % 8) * 90}ms` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  detail,
  active = false,
}: {
  value: number;
  label: string;
  detail?: string;
  active?: boolean;
}) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="label">{label}</span>
        <span className="tabular font-mono text-[15px] text-muted">
          {detail ?? `${percent}%`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className={cn(
            "h-full rounded-full bg-pine transition-[width] duration-500 ease-out",
            active && "bg-[linear-gradient(90deg,var(--pine),var(--saffron))]",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
