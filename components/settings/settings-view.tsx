"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const THEME_LABEL = { light: "Light", dark: "Dark", system: "System" } as const;

export function SettingsView() {
  const { settings, setSettings, resetSettings, resolvedTheme } = usePreferences();
  const themeLabel = THEME_LABEL[settings.theme];

  const reduceMotion = settings?.reduceMotion ?? false;
  const showExplicit = settings?.showExplicit ?? true;

  return (
    <div className="container-page pt-8 lg:pt-12">
      <header className="max-w-2xl">
        <p className="label">Preferences</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)] text-ink">Settings</h1>
        <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted">
          Stored in this browser. Nothing here is synced or uploaded anywhere.
        </p>
      </header>

      <div className="mt-8 grid max-w-2xl gap-4">
        <section className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[17px] font-medium text-ink">Appearance</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">
                {settings.theme === "system"
                  ? "System is the default — you follow your OS, including when you change it."
                  : `Pinned to ${themeLabel}. Pick System to go back to following your OS.`}
              </p>
              <p className="mt-1 font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
                Selected · {themeLabel} · Now {resolvedTheme}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </section>

        <section className="card p-5">
          <Switch
            id="reduce-motion"
            checked={reduceMotion}
            onChange={(checked) => setSettings({ reduceMotion: checked })}
            label="Reduce motion"
            description="Minimises animations and transitions across the app."
          />
          <div className="rule" />
          <Switch
            id="show-explicit"
            checked={showExplicit}
            onChange={(checked) => setSettings({ showExplicit: checked })}
            label="Show explicit matches"
            description="Keep tracks flagged explicit in provider metadata in the results."
          />
        </section>

        <section className="card p-5">
          <h2 className="text-[17px] font-medium text-ink">Data</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">
            History, favorites and search history live in your browser only.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={resetSettings}>
              Reset settings
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
