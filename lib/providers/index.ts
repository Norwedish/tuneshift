import type { Platform } from "@/types/music";
import type { MusicProvider } from "./types";
import { spotifyProvider } from "./spotify";
import { youtubeProvider } from "./youtube";

const PROVIDERS: Record<Platform, MusicProvider> = {
  spotify: spotifyProvider,
  youtube: youtubeProvider,
};

export function getProvider(platform: Platform): MusicProvider {
  return PROVIDERS[platform];
}

export function allProviders(): MusicProvider[] {
  return [spotifyProvider, youtubeProvider];
}

export async function providerStatus() {
  const entries = await Promise.all(
    allProviders().map(async (provider) => {
      const health = await provider.checkHealth();
      return [provider.platform, { ...health, label: provider.label }] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<
    Platform,
    { configured: boolean; ok: boolean; message?: string; latencyMs?: number; label: string }
  >;
}

export { spotifyProvider, youtubeProvider };
export type { MusicProvider } from "./types";
