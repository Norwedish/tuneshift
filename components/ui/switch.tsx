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
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border bg-surface-2 transition-colors duration-200",
          checked ? "border-pine [box-shadow:0_0_12px_var(--glow-ring)]" : "border-line-strong",
          "focus-within:border-glow/50 focus-within:bg-glow/50 peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          disabled && "opacity-50",
        )}
      >
        {/* Offsets are pinned (not static-positioned): a button's static
           position is UA-defined and ignores the track's own geometry. Travel
           = track w-11 − borders − knob size-4.5 − 2 gaps, in rem so it scales
           with html font-size like the track does. The track stays a fixed
           capsule (shrink-0, sized in rem); state lives on the knob, so
           narrowing the viewport can never stretch the track into a lozenge. */}
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-4.5 rounded-full shadow-sm transition-[translate] duration-200",
            checked ? "translate-x-5 bg-pine" : "translate-x-0 bg-line-strong",
          )}
        />
      </button>
    </div>
  );
}
