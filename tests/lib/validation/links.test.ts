import { describe, expect, it } from "vitest";
import {
  canonicalTrackUrl,
  detectPlatform,
  oppositePlatform,
  parseMusicLink,
  safeHref,
  sanitizeQuery,
} from "@/lib/validation/links";

const SPOTIFY_TRACK_ID = "4cOdK2wGLETKBW3PvgPWqT";

describe("parseMusicLink", () => {
  it("rejects empty input with a hint", () => {
    const parsed = parseMusicLink("   ");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("invalid_url");
    expect(parsed.hint).toContain("either direction");
  });

  it("rejects non-http schemes", () => {
    const parsed = parseMusicLink("javascript:alert(1)");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.code).toBe("invalid_url");
  });

  it("rejects overly long input", () => {
    const parsed = parseMusicLink("https://open.spotify.com/track/" + "a".repeat(64));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.code).toBe("invalid_url");
  });

  it("rejects unsupported hosts", () => {
    const parsed = parseMusicLink("https://example.com/watch?v=abc");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.code).toBe("unsupported_platform");
  });

  it("parses a Spotify track link", () => {
    const parsed = parseMusicLink(`https://open.spotify.com/track/${SPOTIFY_TRACK_ID}`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.platform).toBe("spotify");
    expect(parsed.kind).toBe("track");
    expect(parsed.id).toBe(SPOTIFY_TRACK_ID);
    expect(parsed.canonicalUrl).toBe(`https://open.spotify.com/track/${SPOTIFY_TRACK_ID}`);
  });

  it("parses Spotify URIs", () => {
    const parsed = parseMusicLink(`spotify:track:${SPOTIFY_TRACK_ID}`);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.platform).toBe("spotify");
      expect(parsed.kind).toBe("track");
    }
  });

  it("parses Spotify album links", () => {
    const parsed = parseMusicLink(`https://open.spotify.com/album/37i9dQZF1DXcBWIGoYBM5M`);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.kind).toBe("album");
  });

  it("parses Spotify playlists", () => {
    const parsed = parseMusicLink("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.kind).toBe("playlist");
  });

  it("treats a playlist context as context, not as the track itself", () => {
    const parsed = parseMusicLink(
      `https://open.spotify.com/track/${SPOTIFY_TRACK_ID}?context=3Zf2b1m7kQpL2vN8fD4hT5w`,
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.hadPlaylistContext).toBe(true);
  });

  it("parses youtu.be share links", () => {
    const parsed = parseMusicLink("https://youtu.be/dQw4w9WgXcQ");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.platform).toBe("youtube");
      expect(parsed.kind).toBe("track");
      expect(parsed.id).toBe("dQw4w9WgXcQ");
    }
  });

  it("keeps playlist context for watch links", () => {
    const parsed = parseMusicLink(
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdefghijklmnop",
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.kind).toBe("track");
      expect(parsed.hadPlaylistContext).toBe(true);
    }
  });

  it("parses plain YouTube Music playlists", () => {
    const parsed = parseMusicLink("https://music.youtube.com/playlist?list=PLabcdefghijklmnop");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.kind).toBe("playlist");
  });

  it("refuses auto-generated radio mixes", () => {
    const parsed = parseMusicLink("https://music.youtube.com/playlist?list=RD" + "a".repeat(10));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("unsupported_url");
  });

  it("refuses channel upload feeds", () => {
    const parsed = parseMusicLink("https://music.youtube.com/playlist?list=UU" + "a".repeat(10));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.code).toBe("unsupported_url");
  });

  it("parses shorts links", () => {
    const parsed = parseMusicLink("https://youtube.com/shorts/dQw4w9WgXcQ");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.id).toBe("dQw4w9WgXcQ");
  });
});

describe("detectPlatform", () => {
  it("detects the platform of a pasted link", () => {
    expect(detectPlatform(`https://open.spotify.com/track/${SPOTIFY_TRACK_ID}`)).toBe("spotify");
    expect(detectPlatform("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });

  it("returns null for unsupported input", () => {
    expect(detectPlatform("not a link")).toBeNull();
  });
});

describe("canonical URLs and query helpers", () => {
  it("builds canonical track URLs", () => {
    expect(canonicalTrackUrl("spotify", "abc")).toBe("https://open.spotify.com/track/abc");
    expect(canonicalTrackUrl("youtube", "abc")).toBe("https://music.youtube.com/watch?v=abc");
  });

  it("flips platforms", () => {
    expect(oppositePlatform("spotify")).toBe("youtube");
    expect(oppositePlatform("youtube")).toBe("spotify");
  });

  it("sanitises search queries", () => {
    expect(sanitizeQuery("  hello   world  ")).toBe("hello world");
    expect(sanitizeQuery("a".repeat(200))).toHaveLength(160);
  });

  it("only allows safe music links", () => {
    expect(safeHref("https://open.spotify.com/track/abc")).toBe(
      "https://open.spotify.com/track/abc",
    );
    expect(safeHref("http://open.spotify.com/track/abc")).toBeUndefined();
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
  });
});
