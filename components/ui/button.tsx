import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "saffron";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

/* pill buttons: geometry and motion live here, paint lives in globals.css
   (.btn-primary / .btn-secondary / .btn-ghost / .btn-danger / .btn-glow). */
const BASE =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,border-color,box-shadow,filter,transform] duration-200 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine dark:focus-visible:outline-glow";

const VARIANTS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
  saffron: "btn-glow",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-[15px]",
  md: "h-11 px-4.5 text-[16px]",
  lg: "h-12 px-5 text-[17px]",
  icon: "size-10",
  "icon-sm": "size-8",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
});

export function buttonStyles(
  options: { variant?: Variant; size?: Size; className?: string } = {},
): string {
  const { variant = "primary", size = "md", className } = options;
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}
