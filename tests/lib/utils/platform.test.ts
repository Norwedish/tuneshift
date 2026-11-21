import { describe, expect, it } from "vitest";
import {
  otherPlatform,
  platformLabel,
  platformShortLabel,
  trackSubtitle,
} from "@/lib/utils/platform";

describe("platformLabel", () => {
  it("labels both platforms", () => {
    expect(platformLabel("spotify")).toBe("Spotify");
    expect(platformLabel("youtube")).toBe("YouTube Music");
  });
});

describe("platformShortLabel", () => {
  it("shortens YouTube Music", () => {
    expect(platformShortLabel("spotify")).toBe("Spotify");
    expect(platformShortLabel("youtube")).toBe("YT Music");
  });
});

describe("otherPlatform", () => {
  it("flips platforms", () => {
    expect(otherPlatform("spotify")).toBe("youtube");
    expect(otherPlatform("youtube")).toBe("spotify");
  });
});

describe("trackSubtitle", () => {
  it("joins artist names", () => {
    expect(trackSubtitle([{ name: "Artist A" }, { name: "Artist B" }])).toBe(
      "Artist A, Artist B",
    );
  });
});
