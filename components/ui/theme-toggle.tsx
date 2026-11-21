"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { usePreferences } from "@/components/providers/preferences-provider";
import { cn } from "@/lib/utils/cn";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { settings, setSettings } = usePreferences();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex rounded-full border border-line bg-surface-2 p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = settings.theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => setSettings({ theme: option.value })}
            className={cn(
              "flex h-8 flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-full px-1.5 sm:px-2.5 text-[13px] sm:text-[14px] font-medium transition-all",
              active ? "bg-surface text-ink shadow-sm font-semibold" : "text-muted hover:text-ink-2",
            )}
          >
            <option.icon className="size-3" aria-hidden />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
