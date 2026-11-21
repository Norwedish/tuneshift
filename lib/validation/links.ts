import type { CollectionKind, Platform } from "@/types/music";

export type LinkKind = "track" | CollectionKind;

export type ParsedLink =
  | {
      ok: true;
      platform: Platform;
      kind: LinkKind;
      id: string;
      canonicalUrl: string;
      hadPlaylistContext: boolean;
    }
  | {
      ok: false;
      code: "invalid_url" | "unsupported_url" | "unsupported_platform";
      message: string;
      hint: string;
    };

const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_PLAYLIST_ID = /^[A-Za-z0-9_-]{12,60}$/;

const SPOTIFY_HOSTS = new Set([
  "open.spotify.com",
  "play.spotify.com",
  "embed.spotify.com",
]);

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function fail(
  code: "invalid_url" | "unsupported_url" | "unsupported_platform",
  message: string,
  hint: string,
): ParsedLink {
  return { ok: false, code, message, hint };
}

function parseSpotifyUri(raw: string): ParsedLink | null {
  // spotify:track:4cOdK2wGLETKBW3PvgPWqT  (also spotify:user:name:playlist:id)
  const parts = raw.split(":");
  if (parts[0]?.toLowerCase() !== "spotify") return null;

  const kind = parts[1]?.toLowerCase();
  const id = parts[parts.length - 1] ?? "";

  if (kind === "track" && SPOTIFY_ID.test(id)) {
    return {
      ok: true,
      platform: "spotify",
      kind: "track",
      id,
      canonicalUrl: `https://open.spotify.com/track/${id}`,
      hadPlaylistContext: false,
    };
  }
  if ((kind === "album" || kind === "playlist") && SPOTIFY_ID.test(id)) {
    return {
      ok: true,
      platform: "spotify",
      kind,
      id,
      canonicalUrl: `https://open.spotify.com/${kind}/${id}`,
      hadPlaylistContext: false,
    };
  }
  return fail(
    "invalid_url",
    "That Spotify URI doesn't look complete.",
    "It should look like spotify:track:4cOdK2wGLETKBW3PvgPWqT.",
  );
}

function parseSpotifyUrl(url: URL): ParsedLink {
  const segments = url.pathname.split("/").filter(Boolean);

  // Strip an optional locale segment: /intl-de/track/...
  const first = segments[0]?.toLowerCase();
  if (first?.startsWith("intl-")) segments.shift();

  const head = segments[0]?.toLowerCase();

  // /embed/track/{id}
  if (head === "embed") segments.shift();

  // /user/{user}/playlist/{id}
  if (segments[0]?.toLowerCase() === "user" && segments[2]?.toLowerCase() === "playlist") {
    const id = segments[3] ?? "";
    if (SPOTIFY_ID.test(id)) {
      return {
        ok: true,
        platform: "spotify",
        kind: "playlist",
        id,
        canonicalUrl: `https://open.spotify.com/playlist/${id}`,
        hadPlaylistContext: false,
      };
    }
  }

  const kind = segments[0]?.toLowerCase();
  const id = segments[1] ?? "";

  if (!kind || !["track", "album", "playlist"].includes(kind)) {
    return fail(
      "unsupported_url",
      "That Spotify link isn't a song, album or playlist.",
      "Open the item in Spotify, choose Share, and paste that link instead.",
    );
  }

  if (!SPOTIFY_ID.test(id)) {
    return fail(
      "invalid_url",
      "That Spotify link is missing a valid ID.",
      "Spotify IDs are 22 characters long. Try copying the share link again.",
    );
  }

  return {
    ok: true,
    platform: "spotify",
    kind: kind as LinkKind,
    id,
    canonicalUrl: `https://open.spotify.com/${kind}/${id}`,
    hadPlaylistContext: url.searchParams.has("context"),
  };
}

function parseYouTubeUrl(url: URL): ParsedLink {
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  const playlistId = url.searchParams.get("list") ?? undefined;
  const videoId = url.searchParams.get("v") ?? undefined;

  const buildTrack = (id: string, withPlaylist: boolean): ParsedLink => {
    if (!YOUTUBE_VIDEO_ID.test(id)) {
      return fail(
        "invalid_url",
        "That YouTube link is missing a valid video ID.",
        "Video IDs are 11 characters. Copy the link from the player's Share button.",
      );
    }
    return {
      ok: true,
      platform: "youtube",
      kind: "track",
      id,
      canonicalUrl: `https://music.youtube.com/watch?v=${id}`,
      hadPlaylistContext: withPlaylist,
    };
  };

  // youtu.be/{id}
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = segments[0] ?? "";
    return buildTrack(id, Boolean(playlistId));
  }

  // /shorts/{id} and /embed/{id}
  if (segments[0] === "shorts" || segments[0] === "embed" || segments[0] === "live") {
    return buildTrack(segments[1] ?? "", Boolean(playlistId));
  }

  // /watch?v=... always wins, even when a mix/radio list is attached.
  if (segments[0] === "watch" || videoId) {
    if (!videoId) {
      return fail(
        "invalid_url",
        "That YouTube link doesn't include a video.",
        "A song link looks like youtube.com/watch?v=…",
      );
    }
    return buildTrack(videoId, Boolean(playlistId));
  }

  // /playlist?list=...
  if (segments[0] === "playlist") {
    return parseYouTubePlaylistId(playlistId);
  }

  // YouTube Music album pages use /browse/MPREb_… which the Data API can't read.
  if (segments[0] === "browse" && segments[1]?.startsWith("MPREb")) {
    return fail(
      "unsupported_url",
      "YouTube Music album pages can't be read through the official API.",
      "On the album page choose Share → Copy link. That gives a playlist link we can read.",
    );
  }

  if (playlistId) return parseYouTubePlaylistId(playlistId);

  return fail(
    "unsupported_url",
    "That YouTube link isn't a song or playlist.",
    "Paste a link that contains /watch?v=… or /playlist?list=…",
  );
}

function parseYouTubePlaylistId(playlistId: string | undefined): ParsedLink {
  if (!playlistId || !YOUTUBE_PLAYLIST_ID.test(playlistId)) {
    return fail(
      "invalid_url",
      "That YouTube playlist link is missing a valid list ID.",
      "Playlist links look like music.youtube.com/playlist?list=…",
    );
  }

  if (playlistId.startsWith("RD")) {
    return fail(
      "unsupported_url",
      "That's an auto-generated radio mix, not a playlist.",
      "YouTube builds those on the fly, so there's no fixed track list to copy.",
    );
  }
  if (playlistId === "WL") {
    return fail(
      "unsupported_url",
      "Watch Later is private to your account.",
      "TuneShift works without sign-in, so it can't read private lists.",
    );
  }
  if (playlistId.startsWith("LL")) {
    return fail(
      "unsupported_url",
      "Liked Music is private to your account.",
      "Public playlists (they start with PL) can be converted without signing in.",
    );
  }
  if (playlistId.startsWith("UU")) {
    return fail(
      "unsupported_url",
      "That's a channel's upload feed, not a playlist.",
      "Paste a public playlist link starting with PL, or an album link.",
    );
  }

  return {
    ok: true,
    platform: "youtube",
    kind: "playlist",
    id: playlistId,
    canonicalUrl: `https://music.youtube.com/playlist?list=${playlistId}`,
    hadPlaylistContext: false,
  };
}

/**
 * Pure, total parser. Never performs I/O and never trusts the input: only
 * allow-listed hosts are recognised, and only IDs are extracted — the raw URL
 * is never fetched, which removes the SSRF surface entirely.
 */
export function parseMusicLink(input: string): ParsedLink {
  const raw = input.trim();

  if (!raw) {
    return fail("invalid_url", "Paste a link first.", "Spotify or YouTube Music, either direction.");
  }
  if (raw.length > 2048) {
    return fail("invalid_url", "That link is too long.", "Paste just the share link for the item.");
  }
  if (/^javascript:/i.test(raw) || /^data:/i.test(raw) || /^file:/i.test(raw)) {
    return fail("invalid_url", "That isn't a web link.", "Only https links are accepted.");
  }

  const spotifyUri = parseSpotifyUri(raw);
  if (spotifyUri) return spotifyUri;

  // Accept a bare host ("open.spotify.com/track/…") but never guess a scheme
  // for anything that already declares one.
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
  let candidate = raw;
  if (!hasScheme) {
    candidate = `https://${raw.replace(/^\/+/, "")}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return fail(
      "invalid_url",
      "That doesn't look like a valid link.",
      "Copy the share link directly from Spotify or YouTube Music.",
    );
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return fail("invalid_url", "Only http and https links are supported.", "Paste the share link.");
  }

  const host = url.hostname.toLowerCase();

  if (SPOTIFY_HOSTS.has(host)) return parseSpotifyUrl(url);
  if (YOUTUBE_HOSTS.has(host)) return parseYouTubeUrl(url);

  return fail(
    "unsupported_platform",
    `TuneShift doesn't recognise ${host}.`,
    "Supported sources: open.spotify.com, music.youtube.com and youtube.com.",
  );
}

/** Cheap client-side hint used to switch UI state before the user submits. */
export function detectPlatform(input: string): Platform | null {
  const parsed = parseMusicLink(input);
  return parsed.ok ? parsed.platform : null;
}

export function oppositePlatform(platform: Platform): Platform {
  return platform === "spotify" ? "youtube" : "spotify";
}

export function canonicalTrackUrl(platform: Platform, id: string): string {
  return platform === "spotify"
    ? `https://open.spotify.com/track/${id}`
    : `https://music.youtube.com/watch?v=${id}`;
}

const SAFE_LINK_HOSTS = new Set([
  "open.spotify.com",
  "spotify.com",
  "music.youtube.com",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "i.scdn.co",
  "i.ytimg.com",
]);

/** Only https links to known music hosts may reach an href or an <img src>. */
export function safeHref(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return undefined;
    if (!SAFE_LINK_HOSTS.has(url.hostname.toLowerCase())) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function sanitizeQuery(input: string): string {
  return input
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}
