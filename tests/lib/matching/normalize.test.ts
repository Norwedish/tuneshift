import { describe, expect, it } from "vitest";
import {
  contentTokens,
  normalize,
  parseTitle,
  splitArtistTitle,
  stripChannelSuffix,
  stripDiacritics,
} from "@/lib/matching/normalize";

describe("normalize", () => {
  it("lowercases and strips diacritics", () => {
    expect(normalize("Beyoncé")).toBe("beyonce");
    expect(normalize("AC/DC")).toBe("ac dc");
  });

  it("collapses whitespace and stray punctuation", () => {
    expect(normalize("  Hello,   WORLD! ")).toBe("hello world");
  });

  it("expands ampersand to the word and", () => {
    expect(normalize("A & B")).toBe("a and b");
  });
});

describe("stripDiacritics", () => {
  it("removes combining marks", () => {
    expect(stripDiacritics("Beyoncé")).toBe("Beyonce");
  });
});

describe("contentTokens", () => {
  it("drops stop words and keeps single-word names", () => {
    expect(contentTokens("The Weeknd")).toEqual(["weeknd"]);
    expect(contentTokens("Blinding Lights")).toEqual(["blinding", "lights"]);
    expect(contentTokens("ABBA")).toEqual(["abba"]);
  });
});

describe("parseTitle", () => {
  it("reads the bare title with no version tags", () => {
    const parsed = parseTitle("Blinding Lights");
    expect(parsed.base).toBe("blinding lights");
    expect(parsed.versionTags).toEqual([]);
  });

  it("collects version tags from brackets", () => {
    const parsed = parseTitle("Blinding Lights (Remix)");
    expect(parsed.base).toBe("blinding lights");
    expect(parsed.versionTags).toContain("remix");
  });

  it("treats dash tails like 'Remastered 2011' as version suffixes", () => {
    const parsed = parseTitle("Blinding Lights - Remastered 2011");
    expect(parsed.base).toBe("blinding lights");
    expect(parsed.versionTags).toContain("remaster");
  });

  it("splits featured-artist clauses off the base title", () => {
    const parsed = parseTitle("Song One feat. Artist Two");
    expect(parsed.base).toBe("song one");
    expect(parsed.featured).toEqual(["Artist Two"]);
  });
});

describe("splitArtistTitle", () => {
  it("splits 'Artist - Song' shapes", () => {
    expect(splitArtistTitle("The Weeknd - Blinding Lights")).toEqual({
      artist: "The Weeknd",
      title: "Blinding Lights",
    });
  });

  it("returns untitled input untouched", () => {
    expect(splitArtistTitle("Just A Song")).toEqual({ title: "Just A Song" });
  });
});

describe("stripChannelSuffix", () => {
  it("removes the '- Topic' channel suffix", () => {
    expect(stripChannelSuffix("Artist - Topic")).toBe("Artist");
  });
});
