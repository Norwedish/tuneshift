import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-[16px] border border-line bg-surface px-3.5 text-[16px] text-ink shadow-xs transition-[border-color,box-shadow] duration-200",
          "placeholder:text-faint",
          "hover:border-line-strong",
          "focus:border-pine/70 focus:outline-none focus:ring-5 focus:ring-glow/18",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-y rounded-[16px] border border-line bg-surface p-3.5 text-[16px] text-ink shadow-xs transition-[border-color,box-shadow]",
        "placeholder:text-faint focus:border-pine/70 focus:outline-none focus:ring-5 focus:ring-glow/18",
        className,
      )}
      {...props}
    />
  );
});

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="label block">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[15px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}
