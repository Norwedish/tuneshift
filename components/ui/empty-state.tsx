import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden card border-dashed border-line-strong bg-surface/50 text-center",
        compact ? "px-6 py-10" : "px-6 py-16 sm:py-20",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:radial-gradient(circle_at_center,var(--line)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]"
      />
      <div className="relative mb-4 flex size-12 items-center justify-center rounded-[20px] border border-line bg-surface shadow-xs">
        <Icon className="size-5 text-muted" aria-hidden />
      </div>
      <h3 className="display relative text-[22px] text-ink">{title}</h3>
      <p className="relative mt-2 max-w-sm text-[16px] leading-relaxed text-muted">{description}</p>
      {action ? <div className="relative mt-5">{action}</div> : null}
    </div>
  );
}

export function InlineNotice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: "info" | "warn" | "danger" | "ok";
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const tones = {
    info: "border-line bg-surface-2/60 text-ink-2",
    warn: "border-warn/25 bg-warn-soft text-warn",
    danger: "border-danger/25 bg-danger-soft text-danger",
    ok: "border-ok/25 bg-ok-soft text-ok",
  } as const;

  return (
    <div className={cn("rounded-[18px] border px-3.5 py-3 text-[15.5px] leading-relaxed", tones[tone])}>
      <div className="flex items-start gap-2.5">
        <div className="min-w-0 flex-1">
          {title ? <p className="mb-0.5 font-medium">{title}</p> : null}
          <div className="opacity-90 [&_a]:underline [&_a]:underline-offset-2">{children}</div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
