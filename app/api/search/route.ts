import { fail, ok } from "@/lib/api/respond";
import { enforceRateLimit, searchLimiter } from "@/lib/api/limiters";
import { appCache } from "@/lib/cache";
import { toPublicError } from "@/lib/errors";
import { spotifyProvider, youtubeProvider } from "@/lib/providers";
import { sanitizeQuery } from "@/lib/validation/links";
import type { ApiErrorBody, SearchResponse } from "@/types/api";
import type { Platform, Track } from "@/types/music";

export const dynamic = "force-dynamic";

const SEARCH_TTL_SECONDS = 120;

export async function GET(request: Request) {
  try {
    enforceRateLimit(searchLimiter, request);

    const params = new URL(request.url).searchParams;
    const query = sanitizeQuery(params.get("q") ?? "");
    const requestedPlatform = params.get("platform");
    const platform: Platform | undefined =
      requestedPlatform === "spotify" || requestedPlatform === "youtube"
        ? requestedPlatform
        : undefined;
    const limit = Math.min(Math.max(Number(params.get("limit") ?? 8), 1), 15);

    if (query.length < 2) {
      return ok<SearchResponse>({
        query,
        results: [],
        counts: {},
        errors: {},
      });
    }

    const targets = platform ? [platform] : (["spotify", "youtube"] as Platform[]);

    const settled = await Promise.all(
      targets.map(async (target) => {
        const provider = target === "spotify" ? spotifyProvider : youtubeProvider;
        if (!provider.isConfigured()) {
          return {
            platform: target,
            tracks: [] as Track[],
            error: toPublicError(
              new Error("not configured"),
            ) as ApiErrorBody["error"],
            notConfigured: true,
          };
        }
        try {
          const cacheKey = `search:v2:${target}:${limit}:${query.toLowerCase()}`;
          const hit = appCache.get(cacheKey) as Track[] | undefined;
          const tracks =
            hit ?? (await provider.searchTracks(query, { limit }));
          if (!hit) appCache.set(cacheKey, tracks, SEARCH_TTL_SECONDS * 1000);
          return { platform: target, tracks, notConfigured: false };
        } catch (error) {
          return {
            platform: target,
            tracks: [] as Track[],
            error: toPublicError(error),
            notConfigured: false,
          };
        }
      }),
    );

    const results: Track[] = [];
    const counts: SearchResponse["counts"] = {};
    const errors: SearchResponse["errors"] = {};

    for (const entry of settled) {
      counts[entry.platform] = entry.tracks.length;
      if (entry.error) {
        errors[entry.platform] = entry.notConfigured
          ? {
              code: "not_configured",
              message:
                entry.platform === "spotify"
                  ? "Spotify search isn't connected on this deployment."
                  : "YouTube search isn't connected on this deployment.",
              hint: "Add the provider credentials to .env.local to enable live results.",
              platform: entry.platform,
            }
          : entry.error;
        continue;
      }
      results.push(...entry.tracks);
    }

    // Interleave so neither platform dominates the top of the page.
    const byPlatform: Record<Platform, Track[]> = {
      spotify: results.filter((track) => track.platform === "spotify"),
      youtube: results.filter((track) => track.platform === "youtube"),
    };
    const interleaved: Track[] = [];
    const maxLength = Math.max(byPlatform.spotify.length, byPlatform.youtube.length);
    for (let index = 0; index < maxLength; index += 1) {
      const spotifyTrack = byPlatform.spotify[index];
      const youtubeTrack = byPlatform.youtube[index];
      if (spotifyTrack) interleaved.push(spotifyTrack);
      if (youtubeTrack) interleaved.push(youtubeTrack);
    }

    return ok<SearchResponse>({
      query,
      results: interleaved,
      counts,
      errors,
    });
  } catch (error) {
    return fail(error);
  }
}
