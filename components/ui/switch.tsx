"use client";

import { cn } from "@/lib/utils/cn";

export function Switch({
  checked,
  onChange,
  label,
  description,
  id,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-[16px] font-medium text-ink [&:hover]:cursor-pointer"
        >
          {label}
        </label>
        {description ? (
          <p className="mt-1 max-w-md text-[15px] leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors duration-200",
          checked ? "border-pine bg-pine [box-shadow:0_0_10px_var(--glow-ring)]" : "border-line-strong bg-surface-2",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4.5 rounded-full shadow-sm transition-transform duration-200",
            checked ? "translate-x-[22px] bg-pine-ink" : "translate-x-0.5 bg-surface",
          )}
          style={{ width: 18, height: 18 }}
        />
      </button>
    </div>
  );
}
