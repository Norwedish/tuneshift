"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  readJson,
  sanitizeSettings,
  subscribeStorage,
  writeJson,
} from "@/lib/storage/local";
import type { AppSettings } from "@/types/music";

interface PreferencesValue {
  settings: AppSettings;
  resolvedTheme: "light" | "dark";
  hydrated: boolean;
  setSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const PreferencesContext = createContext<PreferencesValue | null>(null);

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const stored = sanitizeSettings(readJson<unknown>(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
    setSettingsState(stored);
    setSystemDark(systemPrefersDark());
    setHydrated(true);

    const unsubscribe = subscribeStorage(STORAGE_KEYS.settings, () => {
      setSettingsState(sanitizeSettings(readJson<unknown>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)));
    });

    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media?.addEventListener("change", onChange);

    return () => {
      unsubscribe();
      media?.removeEventListener("change", onChange);
    };
  }, []);

  const resolvedTheme: "light" | "dark" =
    settings.theme === "system" ? (systemDark ? "dark" : "light") : settings.theme;

  // Apply theme + motion preferences to the document.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
    root.dataset.reduceMotion = settings.reduceMotion ? "true" : "false";

    // Browser chrome (mobile address bar, overscroll area) reads the media-gated
    // theme-color tags; paint both with the resolved theme so an override here
    // still reaches the browser UI.
    const paper = resolvedTheme === "dark" ? "#12152a" : "#f4f5f8";
    for (const meta of document.head.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute("content", paper);
    }
  }, [resolvedTheme, settings.reduceMotion]);

  const setSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettingsState((previous) => {
      const next = { ...previous, ...patch };
      writeJson(STORAGE_KEYS.settings, next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    writeJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({ settings, resolvedTheme, hydrated, setSettings, resetSettings }),
    [settings, resolvedTheme, hydrated, setSettings, resetSettings],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used inside PreferencesProvider");
  return context;
}
