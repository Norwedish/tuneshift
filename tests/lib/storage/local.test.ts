import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, STORAGE_KEYS, sanitizeSettings } from "@/lib/storage/local";

describe("sanitizeSettings", () => {
  it("falls back to defaults for empty input", () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it("rejects unknown themes and keeps booleans tidy", () => {
    const settings = sanitizeSettings({
      theme: "neon",
      reduceMotion: false,
      showExplicit: true,
    });

    expect(settings.theme).toBe("system");
    expect(settings.reduceMotion).toBe(false);
    expect(settings.showExplicit).toBe(true);
  });

  it("keeps valid values", () => {
    const settings = sanitizeSettings({
      theme: "dark",
      reduceMotion: true,
      showExplicit: false,
    });

    expect(settings).toEqual({ theme: "dark", reduceMotion: true, showExplicit: false });
  });

  it("exposes the storage keys the app writes", () => {
    expect(Object.keys(STORAGE_KEYS)).toEqual(
      expect.arrayContaining(["history", "favorites", "settings", "searchHistory"]),
    );
  });
});
