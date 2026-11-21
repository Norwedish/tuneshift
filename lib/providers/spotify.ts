import "server-only";

import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { buildQuery, httpJson } from "@/lib/http";
import { parseTitle } from "@/lib/matching/normalize";
import type { Collection, Track } from "@/types/music";
import {
  MAX_COLLECTION_TRACKS,
  pickImage,
  type MusicProvider,
  type ProviderHealth,
  type SearchOptions,
} from "./types";

const API = "https://api.spotify.com/v1";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const DEFAULT_MARKET = "US";

interface SpotifyImage {
  url?: string;
  width?: number | null;
  height?: number | null;
}

interface SpotifyArtist {
  id?: string;
  name?: string;
}

interface SpotifyAlbum {
  id?: string;
  name?: string;
  images?: SpotifyImage[];
  release_date?: string;
  album_type?: string;
}

interface SpotifyTrack {
  id?: string | null;
  name?: string;
  artists?: SpotifyArtist[];
  album?: SpotifyAlbum;
  duration_ms?: number;
  explicit?: boolean;
  external_ids?: { isrc?: string };
  external_urls?: { spotify?: string };
  is_local?: boolean;
  type?: string;
}

interface SpotifyPaging<T> {
  items?: T[];
  total?: number;
  next?: string | null;
}

interface SpotifyPlaylist {
  id?: string;
  name?: string;
  description?: string | null;
  images?: SpotifyImage[];
  owner?: { display_name?: string; id?: string };
  tracks?: SpotifyPaging<{ track?: SpotifyTrack | null }>;
  items?: SpotifyPaging<{ item?: SpotifyTrack | null; track?: SpotifyTrack | null }>;
  external_urls?: { spotify?: string };
}

let tokenCache: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string> | null = null;

function basicAuth(): string {
  const id = env.spotifyClientId;
  const secret = env.spotifyClientSecret;
  if (!id || !secret) throw notConfigured();
  return Buffer.from(`${id}:${secret}`, "utf8").toString("base64");
}

function notConfigured(): AppError {
  return new AppError({
    code: "not_configured",
    message: "Spotify isn't connected on this deployment yet.",
    hint: "Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local and restart the server.",
    platform: "spotify",
  });
}

/**
 * Client Credentials flow. Read-only public catalogue access — no user data,
 * no OAuth consent screen, and the secret never leaves the server.
 */
async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5_000) return tokenCache.value;
  if (pendingToken) return pendingToken;

  pendingToken = (async () => {
    try {
      const response = await httpJson<{ access_token?: string; expires_in?: number }>(TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth()}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        platform: "spotify",
        label: "Spotify",
        retries: 1,
      });

      if (!response.access_token) {
        throw new AppError({
          code: "unauthorized",
          message: "Spotify didn't return an access token.",
          hint: "Double-check the client ID and secret in your environment variables.",
          platform: "spotify",
          status: 502,
        });
      }

      tokenCache = {
        value: response.access_token,
        expiresAt: Date.now() + ((response.expires_in ?? 3600) - 30) * 1000,
      };
      return response.access_token;
    } finally {
      pendingToken = null;
    }
  })();

  return pendingToken;
}

async function spotifyGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const token = await getAccessToken();
  const query = buildQuery(params);
  return httpJson<T>(`${API}${path}${query ? `?${query}` : ""}`, {
    headers: { Authorization: `Bearer ${token}` },
    platform: "spotify",
    label: "Spotify",
    retries: 2,
  });
}

function mapArtist(artist: SpotifyArtist | undefined): string | undefined {
  const name = artist?.name?.trim();
  return name || undefined;
}

function mapTrack(raw: SpotifyTrack | null | undefined): Track | null {
  if (!raw?.id || raw.is_local || !raw.name) return null;
  const artists = (raw.artists ?? [])
    .map(mapArtist)
    .filter((name): name is string => Boolean(name))
    .map((name, index) => ({ name, ...(raw.artists?.[index]?.id ? { id: raw.artists[index]?.id } : {}) }));

  const year = raw.album?.release_date ? Number(raw.album.release_date.slice(0, 4)) : undefined;

  return {
    id: raw.id,
    platform: "spotify",
    kind: "track",
    title: raw.name,
    artists: artists.length > 0 ? artists : [{ name: "Unknown artist" }],
    ...(raw.album?.name
      ? { album: { name: raw.album.name, ...(raw.album.id ? { id: raw.album.id } : {}) } }
      : {}),
    ...(typeof raw.duration_ms === "number" ? { durationMs: raw.duration_ms } : {}),
    ...(pickImage(raw.album?.images) ? { artworkUrl: pickImage(raw.album?.images) } : {}),
    url: raw.external_urls?.spotify ?? `https://open.spotify.com/track/${raw.id}`,
    ...(typeof raw.explicit === "boolean" ? { explicit: raw.explicit } : {}),
    ...(raw.external_ids?.isrc ? { isrc: raw.external_ids.isrc } : {}),
    ...(year && Number.isFinite(year) ? { year } : {}),
  };
}

function mapTracks(items: Array<SpotifyTrack | null | undefined>): Track[] {
  return items
    .map((item) => mapTrack(item))
    .filter((track): track is Track => track !== null);
}

async function getPlaylistItems(id: string, market: string, total: number): Promise<SpotifyTrack[]> {
  const collected: SpotifyTrack[] = [];
  const limit = 100;
  const max = Math.min(total || MAX_COLLECTION_TRACKS, MAX_COLLECTION_TRACKS);

  for (let offset = 0; offset < max; offset += limit) {
    let page: SpotifyPaging<{ track?: SpotifyTrack | null; item?: SpotifyTrack | null }>;
    try {
      // `/items` is the current shape; `/tracks` still answers on older accounts.
      page = await spotifyGet<SpotifyPaging<{ track?: SpotifyTrack | null; item?: SpotifyTrack | null }>>(
        `/playlists/${id}/items`,
        { market, limit, offset, additional_types: "track" },
      );
    } catch {
      page = await spotifyGet<SpotifyPaging<{ track?: SpotifyTrack | null; item?: SpotifyTrack | null }>>(
        `/playlists/${id}/tracks`,
        { market, limit, offset, additional_types: "track" },
      );
    }

    const chunk = page.items ?? [];
    if (chunk.length === 0) break;
    for (const entry of chunk) {
      const track = entry?.track ?? entry?.item ?? null;
      if (track) collected.push(track);
    }
    if (!page.next) break;
  }

  return collected;
}

export const spotifyProvider: MusicProvider = {
  platform: "spotify",
  label: "Spotify",

  isConfigured() {
    return env.spotifyConfigured;
  },

  async searchTracks(query: string, options: SearchOptions = {}) {
    if (!env.spotifyConfigured) throw notConfigured();
    const limit = Math.min(Math.max(options.limit ?? 10, 1), 20);
    const response = await spotifyGet<{ tracks?: SpotifyPaging<SpotifyTrack> }>("/search", {
      q: query,
      type: "track",
      limit,
      market: options.market ?? DEFAULT_MARKET,
    });
    return mapTracks(response.tracks?.items ?? []);
  },

  async getTrack(id: string) {
    if (!env.spotifyConfigured) throw notConfigured();
    const raw = await spotifyGet<SpotifyTrack>(`/tracks/${encodeURIComponent(id)}`, {
      market: DEFAULT_MARKET,
    });
    const track = mapTrack(raw);
    if (!track) {
      throw new AppError({
        code: "not_found",
        message: "That Spotify track isn't available.",
        hint: "It may be region-locked or removed.",
        platform: "spotify",
      });
    }
    return track;
  },

  async getCollection(kind, id) {
    if (!env.spotifyConfigured) throw notConfigured();

    if (kind === "album") {
      const album = await spotifyGet<{
        id?: string;
        name?: string;
        artists?: SpotifyArtist[];
        images?: SpotifyImage[];
        release_date?: string;
        total_tracks?: number;
        tracks?: SpotifyPaging<SpotifyTrack>;
        external_urls?: { spotify?: string };
      }>(`/albums/${encodeURIComponent(id)}`, { market: DEFAULT_MARKET });

      const embedded = album.tracks?.items ?? [];
      const total = album.tracks?.total ?? album.total_tracks ?? embedded.length;
      let raw = embedded;

      if (total > embedded.length) {
        try {
          const extra = await spotifyGet<SpotifyPaging<SpotifyTrack>>(
            `/albums/${encodeURIComponent(id)}/tracks`,
            { market: DEFAULT_MARKET, limit: 50, offset: 0 },
          );
          raw = extra.items ?? embedded;
        } catch {
          // Embedding is enough for the vast majority of albums.
        }
      }

      const year = album.release_date ? Number(album.release_date.slice(0, 4)) : undefined;

      return {
        id,
        platform: "spotify",
        kind: "album",
        title: album.name ?? "Unknown album",
        owner: (album.artists ?? []).map(mapArtist).filter(Boolean).join(", ") || undefined,
        artworkUrl: pickImage(album.images),
        url: album.external_urls?.spotify ?? `https://open.spotify.com/album/${id}`,
        trackCount: total,
        tracks: mapTracks(raw).slice(0, MAX_COLLECTION_TRACKS),
        ...(year && Number.isFinite(year) ? { year } : {}),
        ...(total > MAX_COLLECTION_TRACKS ? { truncated: true } : {}),
      } satisfies Collection;
    }

    const playlist = await spotifyGet<SpotifyPlaylist>(`/playlists/${encodeURIComponent(id)}`, {
      market: DEFAULT_MARKET,
    });

    const total = playlist.tracks?.total ?? 0;
    const rawItems = await getPlaylistItems(id, DEFAULT_MARKET, total);
    const unavailable = Math.max(0, total - rawItems.length);

    return {
      id,
      platform: "spotify",
      kind: "playlist",
      title: playlist.name ?? "Untitled playlist",
      ...(playlist.description ? { description: playlist.description.replace(/<[^>]*>/g, "") } : {}),
      ...(playlist.owner?.display_name ? { owner: playlist.owner.display_name } : {}),
      artworkUrl: pickImage(playlist.images),
      url: playlist.external_urls?.spotify ?? `https://open.spotify.com/playlist/${id}`,
      trackCount: total,
      tracks: mapTracks(rawItems),
      ...(unavailable > 0 ? { unavailableCount: unavailable } : {}),
      ...(total > MAX_COLLECTION_TRACKS ? { truncated: true } : {}),
    } satisfies Collection;
  },

  async checkHealth(): Promise<ProviderHealth> {
    if (!env.spotifyConfigured) {
      return {
        configured: false,
        ok: false,
        message: "Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET",
      };
    }
    const started = Date.now();
    try {
      await getAccessToken();
      return { configured: true, ok: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        configured: true,
        ok: false,
        message: error instanceof AppError ? error.message : "Spotify rejected the credentials",
      };
    }
  },
};

/** Exposed for the resolver's query builder tests. */
export function spotifySearchQuery(title: string, artist: string): string {
  const parsed = parseTitle(title);
  const clean = parsed.base || title;
  return `${clean} ${artist}`.trim();
}
