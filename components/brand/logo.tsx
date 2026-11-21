import { cn } from "@/lib/utils/cn";

export function Logo({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id="logo-tile" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="var(--pine-hover)" />
          <stop offset="1" stopColor="var(--pine)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="11" fill="url(#logo-tile)" />
      <path d="M8 12h13" stroke="var(--saffron)" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="m18.2 8.4 3.8 3.6-3.8 3.6"
        stroke="var(--saffron)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 20H11"
        stroke="var(--saffron)"
        strokeOpacity="0.5"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M13.8 16.4 10 20l3.8 3.6"
        stroke="var(--saffron)"
        strokeOpacity="0.5"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={size} />
      <span className="display text-[21px] leading-none tracking-[-0.02em] text-ink">
        Tune<span className="text-pine">Shift</span>
      </span>
    </span>
  );
}
