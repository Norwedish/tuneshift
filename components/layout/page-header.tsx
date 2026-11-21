import { ShiftStrip } from "@/components/ui/shift-strip";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("container-page pt-8 lg:pt-12", className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 font-mono text-[15px] uppercase tracking-[0.18em] text-muted">
            <span aria-hidden className="inline-block size-1.5 rotate-45 bg-saffron" />
            {eyebrow}
          </p>
          <h1 className="display mt-3 text-[clamp(2.1rem,6vw,3.5rem)] text-ink">{title}</h1>
          {description ? (
            <p className="mt-3 max-w-xl text-[17px] leading-relaxed text-muted sm:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      {children}

      <ShiftStrip segments={72} height="sm" className="mt-6 opacity-45" />
    </header>
  );
}

export function SectionHeader({
  label,
  title,
  description,
  action,
  className,
}: {
  label?: string;
  title: React.ReactNode;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {label ? <p className="label mb-1.5">{label}</p> : null}
        <h2 className="display text-[26px] leading-tight text-ink sm:text-[30px]">{title}</h2>
        {description ? (
          <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 pb-1">{action}</div> : null}
    </div>
  );
}
