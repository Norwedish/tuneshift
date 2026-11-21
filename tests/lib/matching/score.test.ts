import { describe, expect, it } from "vitest";
import type { Track } from "@/types/music";
import {
  WEIGHTS,
  artistSimilarity,
  confidenceFor,
  durationSimilarity,
  rankMatches,
  scoreCandidate,
  stringSimilarity,
} from "@/lib/matching/score";
import { normalize } from "@/lib/matching/normalize";

function makeSource(): Track {
  return {
    id: "src-1",
    platform: "spotify",
    kind: "track",
    title: "Blinding Lights",
    artists: [{ id: "artist-1", name: "The Weeknd" }],
    album: { id: "album-1", name: "After Hours" },
    durationMs: 200_000,
    url: "https://open.spotify.com/track/src-1",
  };
}

function makeCandidate(overrides: Record<string, unknown> = {}): Track {
  return {
    id: "cand-1",
    platform: "spotify",
    kind: "track",
    title: "Blinding Lights",
    artists: [{ id: "artist-1", name: "The Weeknd" }],
    album: { id: "album-1", name: "After Hours" },
    durationMs: 200_000,
    url: "https://open.spotify.com/track/cand-1",
    ...overrides,
  } as Track;
}

describe("stringSimilarity", () => {
  it("scores identical strings as fully similar", () => {
    expect(stringSimilarity("Blinding Lights", "Blinding Lights")).toBe(1);
  });

  it("scores very different strings as dissimilar", () => {
    expect(stringSimilarity("Blinding Lights", "Forever Borne")).toBeLessThan(0.3);
  });

  it("normalises accents before comparing", () => {
    expect(stringSimilarity("Beyoncé", "Berce")).toBeGreaterThan(0.5);
  });
});

describe("artistSimilarity", () => {
  it("scores the same artist as a strong match", () => {
    expect(artistSimilarity(["The Weeknd"], ["The Weeknd"])).toBeGreaterThan(0.9);
  });

  it("scores different artists as weak", () => {
    expect(artistSimilarity(["The Weeknd"], ["Radiohead"])).toBeLessThan(0.5);
  });
});

describe("durationSimilarity", () => {
  it("returns perfect scores for equal durations", () => {
    expect(durationSimilarity(200_000, 200_000)).toBe(1);
  });

  it("penalises large differences", () => {
    expect(durationSimilarity(200_000, 260_000)).toBeLessThan(0.2);
  });

  it("defaults unknown durations to a neutral score", () => {
    expect(durationSimilarity(undefined, 120_000)).toBe(0.6);
  });
});

describe("scoreCandidate", () => {
  it("gives an exact duplicate a perfect score", () => {
    const result = scoreCandidate(makeSource(), makeCandidate());
    expect(result.score).toBeCloseTo(1, 2);
    expect(result.confidence).toBe("excellent");
    expect(result.breakdown).toEqual({
      title: 1,
      artist: 1,
      album: 1,
      duration: 1,
      version: 1,
    });
  });

  it("penalises candidates with a different artist", () => {
    const result = scoreCandidate(makeSource(), makeCandidate({ artists: [{ name: "Radiohead" }] }));
    expect(result.score).toBeLessThan(1);
    expect(result.confidence).not.toBe("excellent");
  });

  it("flags regular YouTube uploads", () => {
    const result = scoreCandidate(makeSource(), makeCandidate({ videoKind: "video" }));
    expect(result.warnings).toContain("Regular YouTube upload, not a YouTube Music track");
  });

  it("flags inferred metadata", () => {
    const result = scoreCandidate(makeSource(), makeCandidate({ inferred: true }));
    expect(result.warnings).toContain("Metadata inferred from the video title");
  });
});

describe("rankMatches", () => {
  it("picks the single best candidate", () => {
    const source = makeSource();
    const result = rankMatches(source, [makeCandidate({ id: "good-2" })]);

    expect(result.candidates).toHaveLength(1);
    expect(result.best?.track.id).toBe("good-2");
  });

  it("drops candidates below the ranking floor", () => {
    const source = makeSource();
    const unrelated = makeCandidate({
      id: "far-away",
      title: "Zzz Unknown Song",
      artists: [{ name: "Radiohead" }],
      album: { name: "Nowhere Land" },
      durationMs: 4_000,
      videoKind: "video",
    });

    const weak = scoreCandidate(source, unrelated);
    expect(weak.score).toBeLessThan(0.28);

    const result = rankMatches(source, [unrelated]);
    expect(result.best).toBeNull();
    expect(result.candidates).toEqual([]);
  });

  it("respects the candidate limit", () => {
    const source = makeSource();
    const result = rankMatches(source, [makeCandidate({ id: "a" }), makeCandidate({ id: "b" })], {
      limit: 1,
    });
    expect(result.candidates).toHaveLength(1);
  });
});

describe("weights and confidence", () => {
  it("sum to one", () => {
    expect(Object.values(WEIGHTS).reduce((total, value) => total + value, 0)).toBeCloseTo(1, 5);
  });

  it("maps scores onto confidence bands", () => {
    expect(confidenceFor(0.9)).toBe("excellent");
    expect(confidenceFor(0.7)).toBe("good");
    expect(confidenceFor(0.6)).toBe("possible");
    expect(confidenceFor(0.1)).toBe("low");
  });
});

describe("normalize helpers", () => {
  it("tokenises content words", () => {
    expect(normalize("Blinding Lights")).toBe("blinding lights");
  });
});
