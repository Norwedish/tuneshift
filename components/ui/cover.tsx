import Image from "next/image";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Cover({
  src,
  alt,
  size = 56,
  className,
  rounded = "rounded-[16px]",
  priority,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
  rounded?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-surface-2 ring-1 ring-black/[0.06] dark:ring-white/[0.08]",
        rounded,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          priority={priority}
          className="object-cover"
          unoptimized={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,var(--surface-3),var(--surface-2))]">
          <Music2
            className="text-faint"
            style={{ width: Math.max(14, size * 0.3), height: Math.max(14, size * 0.3) }}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}
