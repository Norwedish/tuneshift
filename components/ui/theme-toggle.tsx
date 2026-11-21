"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { usePreferences } from "@/components/providers/preferences-provider";
import { cn } from "@/lib/utils/cn";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { settings, setSettings } = usePreferences();

  if (compact) {
    const isDark = settings.theme === "dark";
    return (
      <button
        type="button"
        onClick={() => setSettings({ theme: isDark ? "light" : "dark" })}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-xs transition-colors hover:text-ink"
      >
        {isDark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      </button>
    );
  }

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
              "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 text-[14px] font-medium transition-all",
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
