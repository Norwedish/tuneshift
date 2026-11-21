import "server-only";

import { appCache } from "@/lib/cache";
import { AppError, isAppError, toPublicError } from "@/lib/errors";
import { rankMatches } from "@/lib/matching/score";
import { parseTitle, RECORDING_LEVEL_TAGS } from "@/lib/matching/normalize";
import { getProvider } from "@/lib/providers";
import { parseMusicLink } from "@/lib/validation/links";
import type { MatchResult, Platform, Track } from "@/types/music";
import type { ResolveResponse } from "@/types/api";

const MATCH_CACHE_TTL_SECONDS = 60 * 60 * 6;
const MAX_RESULTS = 12;

export function primaryArtistName(track: Track): string {
  return track.artists[0]?.name ?? track.channelTitle?.replace(/\s*-\s*topic$/i, "") ?? "";
}

/**
 * Build a search string for the destination catalogue.
 * Base title + primary artist + meaningful recording tags (live, remix…),
 * with the YouTube/Spotify noise already stripped by the providers.
 */
export function buildMatchQuery(track: Track): string {
  const parsed = parseTitle(track.title);
  const recordingTags = parsed.versionTags.filter((tag) => RECORDING_LEVEL_TAGS.has(tag));
  const title = parsed.raw
    .replace(/[([][^)\]]*[)\]]/g, (fragment) =>
      /live|remix|acoustic|instrumental|sped|slowed|version/i.test(fragment) ? fragment : "",
    )
    .replace(/\s+/g, " ")
    .trim();

  return [title || parsed.base || track.title, primaryArtistName(track), ...recordingTags]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

async function searchSafely(
  destination: Platform,
  query: string,
  limit: number,
): Promise<{ tracks: Track[]; error?: AppError }> {
  try {
    const provider = getProvider(destination);
    const tracks = await provider.searchTracks(query, { limit });
    return { tracks };
  } catch (error) {
    if (isAppError(error)) return { tracks: [], error };
    return {
      tracks: [],
      error: new AppError({
        code: "internal",
        message: "Search on the destination platform failed.",
        platform: destination,
      }),
    };
  }
}

/**
 * Find the best counterpart for a track on the other platform.
 *
 * Strategy: search with title + artist. If the best score is weak (a common
 * symptom of artist-name differences between catalogues), retry with the
 * title alone and re-rank the merged pool. One retry at most, so a playlist
 * conversion does not double its API quota usage on every track.
 */
export async function findMatches(
  source: Track,
  destination: Platform,
  options: { limit?: number; allowFallback?: boolean } = {},
): Promise<MatchResult> {
  if (source.platform === destination) {
    throw new AppError({
      code: "invalid_request",
      message: "Source and destination must be different platforms.",
    });
  }

  const limit = Math.min(options.limit ?? MAX_RESULTS, 20);
  const cacheKey = `match:v3:${source.platform}:${source.id}:${destination}:${limit}`;
  const cached = appCache.get(cacheKey) as MatchResult | undefined;
  if (cached) return cached;

  const query = buildMatchQuery(source);
  const primary = await searchSafely(destination, query, limit);

  if (primary.error) throw primary.error;

  let result = rankMatches(source, primary.tracks, { limit: 8 });

  const shouldFallback =
    options.allowFallback !== false && (result.best === null || result.score < 0.62);

  if (shouldFallback) {
    const parsed = parseTitle(source.title);
    const titleOnly = parsed.base || source.title;
    if (titleOnly && titleOnly !== query) {
      const fallback = await searchSafely(destination, titleOnly, limit);
      if (!fallback.error && fallback.tracks.length > 0) {
        const merged = [...primary.tracks, ...fallback.tracks];
        const mergedResult = rankMatches(source, merged, { limit: 8 });
        if (!result.best || mergedResult.score > result.score) result = mergedResult;
      }
    }
  }

  appCache.set(cacheKey, result, MATCH_CACHE_TTL_SECONDS * 1000);
  return result;
}

export async function resolveLink(
  url: string,
  options: { metadataOnly?: boolean } = {},
): Promise<ResolveResponse> {
  const parsed = parseMusicLink(url);

  if (!parsed.ok) {
    throw new AppError({
      code: parsed.code,
      message: parsed.message,
      hint: parsed.hint,
    });
  }

  const provider = getProvider(parsed.platform);
  if (!provider.isConfigured()) {
    throw new AppError({
      code: "not_configured",
      message: `${provider.label} isn't connected on this deployment yet.`,
      hint:
        parsed.platform === "spotify"
          ? "Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local."
          : "Set YOUTUBE_API_KEY in .env.local.",
      platform: parsed.platform,
    });
  }

  const destination: Platform = parsed.platform === "spotify" ? "youtube" : "spotify";

  if (parsed.kind === "track") {
    const track = await provider.getTrack(parsed.id);

    if (options.metadataOnly) {
      return {
        kind: "track",
        sourcePlatform: parsed.platform,
        destinationPlatform: destination,
        track,
        match: { best: null, candidates: [], confidence: "low", score: 0 },
      };
    }

    const match = await findMatches(track, destination);
    return {
      kind: "track",
      sourcePlatform: parsed.platform,
      destinationPlatform: destination,
      track,
      match,
    };
  }

  const collection = await provider.getCollection(parsed.kind, parsed.id);

  return {
    kind: collection.kind,
    sourcePlatform: parsed.platform,
    destinationPlatform: destination,
    collection,
  };
}

export { toPublicError };
