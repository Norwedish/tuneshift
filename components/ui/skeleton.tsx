import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function TrackSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex items-center gap-3.5 card p-3.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <Skeleton className="size-[52px] rounded-[14px]" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-2.5 w-1/4" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function TrackListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading results</span>
      {Array.from({ length: count }, (_, index) => (
        <TrackSkeleton key={index} delay={index * 60} />
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 animate-[spin_1s_linear_infinite] rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}
