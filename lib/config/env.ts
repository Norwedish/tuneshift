/**
 * Server-only configuration. Import this from route handlers and server
 * providers — never from a component that ships to the browser.
 *
 * Values are read lazily so `next build` succeeds with an empty env file;
 * the app then reports "not configured" instead of crashing.
 */

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export const env = {
  get spotifyClientId() {
    return clean(process.env.SPOTIFY_CLIENT_ID);
  },
  get spotifyClientSecret() {
    return clean(process.env.SPOTIFY_CLIENT_SECRET);
  },
  get youtubeApiKey() {
    return clean(process.env.YOUTUBE_API_KEY);
  },
  get spotifyConfigured() {
    return Boolean(clean(process.env.SPOTIFY_CLIENT_ID) && clean(process.env.SPOTIFY_CLIENT_SECRET));
  },
  get youtubeConfigured() {
    return Boolean(clean(process.env.YOUTUBE_API_KEY));
  },
  get cacheTtlSeconds() {
    const value = Number(process.env.TUNESHIFT_CACHE_TTL_SECONDS ?? 300);
    return Number.isFinite(value) && value > 0 ? value : 300;
  },
  get rateLimitPerMinute() {
    const value = Number(process.env.TUNESHIFT_RATE_LIMIT_PER_MINUTE ?? 60);
    return Number.isFinite(value) && value > 0 ? value : 60;
  },
} as const;

export const PROVIDER_DOCS = {
  spotify: "https://developer.spotify.com/documentation/web-api",
  youtube: "https://developers.google.com/youtube/v3/getting-started",
} as const;
