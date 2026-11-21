import type { Collection, CollectionKind, Platform, Track } from "@/types/music";

export interface SearchOptions {
  limit?: number;
  market?: string;
}

export interface ProviderHealth {
  configured: boolean;
  ok: boolean;
  message?: string;
  latencyMs?: number;
}

export interface MusicProvider {
  readonly platform: Platform;
  readonly label: string;
  isConfigured(): boolean;
  /** Free-text search against the provider's public catalogue. */
  searchTracks(query: string, options?: SearchOptions): Promise<Track[]>;
  getTrack(id: string): Promise<Track>;
  getCollection(kind: CollectionKind, id: string): Promise<Collection>;
  checkHealth(): Promise<ProviderHealth>;
}

export const MAX_COLLECTION_TRACKS = 200;

export function pickImage(
  images:
    | ReadonlyArray<{ url?: string | null; width?: number | null; height?: number | null }>
    | undefined,
): string | undefined {
  if (!images || images.length === 0) return undefined;
  const sorted = [...images]
    .filter((image): image is { url: string; width?: number | null; height?: number | null } =>
      Boolean(image?.url),
    )
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const best = sorted[0];
  if (!best) return undefined;
  // Album art at 640px+ is plenty; avoid pulling 2000px originals through the proxy.
  return best.url.replace(/^http:\/\//, "https://");
}
