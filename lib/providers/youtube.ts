import "server-only";

import { env } from "@/lib/config/env";
import { AppError } from "@/lib/errors";
import { buildQuery, httpJson } from "@/lib/http";
import { splitArtistTitle, stripChannelSuffix } from "@/lib/matching/normalize";
import type { Collection, Track } from "@/types/music";
import {
  MAX_COLLECTION_TRACKS,
  pickImage,
  type MusicProvider,
  type ProviderHealth,
  type SearchOptions,
} from "./types";

const API = "https://www.googleapis.com/youtube/v3";
const MUSIC_CATEGORY_ID = "10";

interface YouTubeThumbnails {
  default?: { url?: string };
  medium?: { url?: string };
  high?: { url?: string };
  standard?: { url?: string };
  maxres?: { url?: string };
}

interface YouTubeSnippet {
  title?: string;
  channelTitle?: string;
  videoOwnerChannelTitle?: string;
  categoryId?: string;
  publishedAt?: string;
  thumbnails?: YouTubeThumbnails;
  resourceId?: { videoId?: string };
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: YouTubeSnippet;
}

interface YouTubeVideoItem {
  id?: string;
  snippet?: YouTubeSnippet;
  contentDetails?: { duration?: string };
}

interface YouTubePlaylistItem {
  snippet?: YouTubeSnippet;
  contentDetails?: { videoPublishedAt?: string };
}

function notConfigured(): AppError {
  return new AppError({
    code: "not_configured",
    message: "YouTube isn't connected on this deployment yet.",
    hint: "Add YOUTUBE_API_KEY to .env.local and restart the server.",
    platform: "youtube",
  });
}

/** ISO-8601 duration (PT1H2M3S) → milliseconds. */
export function parseIsoDuration(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(value);
  if (!match) return undefined;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const total = ((days * 24 + hours) * 60 + minutes) * 60 + seconds;
  return Number.isFinite(total) && total > 0 ? Math.round(total * 1000) : undefined;
}

/** Strip upload noise but keep meaningful version tags like "(Live)". */
export function cleanVideoTitle(raw: string): string {
  return raw
    .replace(
      /\s*[([(]\s*(official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)|lyric\s*video|with\s*lyrics|lyrics?|visualizer|hd|hq|4k|8k|m\/v|mv|audio\s*only)\s*[)\]]/gi,
      "",
    )
    .replace(
      /\s*[|•]\s*(official\s*(music\s*)?(video|audio)|lyrics?|visualizer|hd|4k)\s*$/gi,
      "",
    )
    .replace(/\s{2,}/g, " ")
    .replace(/[\s\-–—]+$/, "")
    .trim();
}

function thumbnails(snippet: YouTubeSnippet | undefined): string | undefined {
  const set = snippet?.thumbnails;
  if (!set) return undefined;
  const candidates = [set.maxres, set.standard, set.high, set.medium, set.default];
  for (const candidate of candidates) {
    if (candidate?.url) return candidate.url.replace(/^http:\/\//, "https://");
  }
  return undefined;
}

function isTopicChannel(channelTitle: string | undefined): boolean {
  return Boolean(channelTitle && /-\s*topic$/i.test(channelTitle));
}

function inferVideoKind(channelTitle: string | undefined, categoryId?: string): Track["videoKind"] {
  if (isTopicChannel(channelTitle)) return "topic";
  if (categoryId && categoryId !== MUSIC_CATEGORY_ID) return "video";
  return "music";
}

function toTrack(
  videoId: string,
  snippet: YouTubeSnippet | undefined,
  durationMs?: number,
): Track | null {
  if (!videoId || !snippet?.title) return null;

  const channelTitle = snippet.channelTitle ?? snippet.videoOwnerChannelTitle;
  const split = splitArtistTitle(snippet.title);
  const displayTitle = cleanVideoTitle(split.title) || cleanVideoTitle(snippet.title);

  const artistFromChannel = isTopicChannel(channelTitle)
    ? stripChannelSuffix(channelTitle ?? "")
    : undefined;
  const artist = artistFromChannel || split.artist || stripChannelSuffix(channelTitle ?? "") || "Unknown artist";

  const publishedYear = snippet.publishedAt ? Number(snippet.publishedAt.slice(0, 4)) : undefined;

  return {
    id: videoId,
    platform: "youtube",
    kind: "track",
    title: displayTitle,
    artists: [{ name: artist }],
    url: `https://music.youtube.com/watch?v=${videoId}`,
    ...(channelTitle ? { channelTitle } : {}),
    ...(thumbnails(snippet) ? { artworkUrl: thumbnails(snippet) } : {}),
    ...(durationMs ? { durationMs } : {}),
    videoKind: inferVideoKind(channelTitle, snippet.categoryId),
    inferred: !artistFromChannel,
    ...(publishedYear && Number.isFinite(publishedYear) ? { year: publishedYear } : {}),
  };
}

async function youtubeGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  if (!env.youtubeApiKey) throw notConfigured();
  const query = buildQuery({ ...params, key: env.youtubeApiKey });
  return httpJson<T>(`${API}${path}?${query}`, {
    platform: "youtube",
    label: "YouTube",
    retries: 2,
  });
}

async function fetchVideoDetails(ids: string[]): Promise<Map<string, YouTubeVideoItem>> {
  const map = new Map<string, YouTubeVideoItem>();
  if (ids.length === 0) return map;

  for (let index = 0; index < ids.length; index += 50) {
    const chunk = ids.slice(index, index + 50);
    const response = await youtubeGet<{ items?: YouTubeVideoItem[] }>("/videos", {
      part: "snippet,contentDetails",
      id: chunk.join(","),
    });
    for (const item of response.items ?? []) {
      if (item.id) map.set(item.id, item);
    }
  }
  return map;
}

export const youtubeProvider: MusicProvider = {
  platform: "youtube",
  label: "YouTube Music",

  isConfigured() {
    return env.youtubeConfigured;
  },

  async searchTracks(query: string, options: SearchOptions = {}) {
    if (!env.youtubeApiKey) throw notConfigured();
    const limit = Math.min(Math.max(options.limit ?? 10, 1), 25);

    // videoCategoryId=10 restricts search to the Music category, which is the
    // closest officially supported signal for "music video" results. It still
    // returns regular YouTube uploads, so each result is labelled explicitly.
    const response = await youtubeGet<{ items?: YouTubeSearchItem[] }>("/search", {
      part: "snippet",
      type: "video",
      videoCategoryId: String(MUSIC_CATEGORY_ID),
      maxResults: limit,
      q: query,
      safeSearch: "none",
    });

    const ids = (response.items ?? [])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) return [];

    const details = await fetchVideoDetails(ids);

    const tracks: Track[] = [];
    for (const item of response.items ?? []) {
      const id = item.id?.videoId;
      if (!id) continue;
      const detail = details.get(id);
      const track = toTrack(
        id,
        detail?.snippet ?? item.snippet,
        parseIsoDuration(detail?.contentDetails?.duration),
      );
      if (track) tracks.push(track);
    }
    return tracks;
  },

  async getTrack(id: string) {
    if (!env.youtubeApiKey) throw notConfigured();
    const response = await youtubeGet<{ items?: YouTubeVideoItem[] }>("/videos", {
      part: "snippet,contentDetails",
      id,
    });
    const item = response.items?.[0];
    if (!item?.id) {
      throw new AppError({
        code: "not_found",
        message: "That YouTube video isn't available.",
        hint: "It may be private, region-locked or deleted.",
        platform: "youtube",
      });
    }
    const track = toTrack(item.id, item.snippet, parseIsoDuration(item.contentDetails?.duration));
    if (!track) {
      throw new AppError({
        code: "not_found",
        message: "That video doesn't expose usable metadata.",
        platform: "youtube",
      });
    }
    return track;
  },

  async getCollection(kind, id) {
    if (!env.youtubeApiKey) throw notConfigured();

    if (kind === "album") {
      throw new AppError({
        code: "unsupported_url",
        message: "YouTube Music albums aren't exposed through the official API.",
        hint: "Open the album in YouTube Music, choose Share → Copy link, then paste that playlist link.",
        platform: "youtube",
      });
    }

    const meta = await youtubeGet<{
      items?: Array<{
        id?: string;
        snippet?: YouTubeSnippet & { description?: string };
        contentDetails?: { itemCount?: number };
      }>;
    }>("/playlists", { part: "snippet,contentDetails", id });

    const playlist = meta.items?.[0];
    if (!playlist) {
      throw new AppError({
        code: "not_found",
        message: "That YouTube playlist isn't available.",
        hint: "It may be private, unlisted, or deleted. TuneShift only reads public playlists.",
        platform: "youtube",
      });
    }

    const reportedCount = playlist.contentDetails?.itemCount ?? 0;
    const raw: Array<{ videoId: string; snippet: YouTubeSnippet }> = [];
    let pageToken: string | undefined;
    let pages = 0;

    while (pages < 8 && raw.length < MAX_COLLECTION_TRACKS) {
      const page: {
        items?: YouTubePlaylistItem[];
        nextPageToken?: string;
      } = await youtubeGet("/playlistItems", {
        part: "snippet,contentDetails",
        playlistId: id,
        maxResults: 50,
        ...(pageToken ? { pageToken } : {}),
      });

      for (const item of page.items ?? []) {
        const videoId = item.snippet?.resourceId?.videoId;
        if (!videoId || !item.snippet) continue;
        // Deleted/private entries surface with these placeholder titles.
        if (item.snippet.title === "Deleted video" || item.snippet.title === "Private video") continue;
        raw.push({ videoId, snippet: item.snippet });
      }

      pages += 1;
      if (!page.nextPageToken) break;
      pageToken = page.nextPageToken;
    }

    const details = await fetchVideoDetails(raw.map((item) => item.videoId));

    const tracks: Track[] = [];
    for (const entry of raw) {
      const detail = details.get(entry.videoId);
      const merged: YouTubeSnippet = { ...entry.snippet, ...detail?.snippet };
      const track = toTrack(
        entry.videoId,
        merged,
        parseIsoDuration(detail?.contentDetails?.duration),
      );
      if (track) tracks.push(track);
    }

    const isAlbum = id.startsWith("OLAK5uy_");
    const unavailable = Math.max(0, reportedCount - tracks.length);

    return {
      id,
      platform: "youtube",
      kind: isAlbum ? "album" : "playlist",
      title: playlist.snippet?.title ?? "Untitled playlist",
      ...(playlist.snippet?.description
        ? { description: playlist.snippet.description.slice(0, 400) }
        : {}),
      ...(playlist.snippet?.channelTitle ? { owner: playlist.snippet.channelTitle } : {}),
      artworkUrl: pickImage([
        ...(playlist.snippet?.thumbnails?.maxres ? [playlist.snippet.thumbnails.maxres] : []),
        ...(playlist.snippet?.thumbnails?.high ? [playlist.snippet.thumbnails.high] : []),
        ...(tracks[0]?.artworkUrl ? [{ url: tracks[0].artworkUrl, width: 480 }] : []),
      ]),
      url: `https://music.youtube.com/playlist?list=${id}`,
      trackCount: reportedCount || tracks.length,
      tracks,
      ...(unavailable > 0 ? { unavailableCount: unavailable } : {}),
      ...(raw.length >= MAX_COLLECTION_TRACKS ? { truncated: true } : {}),
    } satisfies Collection;
  },

  async checkHealth(): Promise<ProviderHealth> {
    if (!env.youtubeApiKey) {
      return { configured: false, ok: false, message: "Missing YOUTUBE_API_KEY" };
    }
    const started = Date.now();
    try {
      // 1 quota unit, verifies the key and that the Data API is enabled.
      await youtubeGet("/videos", { part: "id", id: "dQw4w9WgXcQ" });
      return { configured: true, ok: true, latencyMs: Date.now() - started };
    } catch (error) {
      return {
        configured: true,
        ok: false,
        message: error instanceof AppError ? error.message : "YouTube rejected the API key",
      };
    }
  },
};
