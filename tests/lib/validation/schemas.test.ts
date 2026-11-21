import { describe, expect, it } from "vitest";
import { collectionMatchRequestSchema, matchRequestSchema } from "@/lib/validation/schemas";

describe("matchRequestSchema", () => {
  it("accepts a minimal valid request", () => {
    const parsed = matchRequestSchema.safeParse({
      track: {
        id: "t-1",
        platform: "spotify",
        kind: "track",
        title: "Blinding Lights",
        artists: [{ name: "The Weeknd" }],
        url: "https://open.spotify.com/track/t-1",
      },
      destination: "youtube",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects unknown destinations", () => {
    const parsed = matchRequestSchema.safeParse({
      track: {
        id: "t-1",
        platform: "spotify",
        kind: "track",
        title: "Blinding Lights",
        artists: [{ name: "The Weeknd" }],
        url: "https://open.spotify.com/track/t-1",
      },
      destination: "soundcloud",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("collectionMatchRequestSchema", () => {
  it("accepts up to twenty tracks", () => {
    const tracks = Array.from({ length: 20 }, (_, index) => ({
      id: `t-${index}`,
      platform: "spotify" as const,
      kind: "track" as const,
      title: `Track ${index}`,
      artists: [{ name: "The Weeknd" }],
      url: `https://open.spotify.com/track/t-${index}`,
      durationMs: 200_000,
    }));

    expect(collectionMatchRequestSchema.safeParse({ tracks, destination: "youtube" }).success).toBe(
      true,
    );
  });

  it("rejects empty track lists", () => {
    expect(collectionMatchRequestSchema.safeParse({ tracks: [], destination: "youtube" }).success).toBe(
      false,
    );
  });
});
