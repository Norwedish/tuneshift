import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatDate,
  formatRelativeTime,
  pluralize,
  truncate,
} from "@/lib/utils/format";

describe("formatRelativeTime", () => {
  it("reads minutes ago", () => {
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe("5m ago");
  });

  it("reads hours ago", () => {
    expect(formatRelativeTime(Date.now() - 3 * 3_600_000)).toBe("3h ago");
  });

  it("reads days ago", () => {
    expect(formatRelativeTime(Date.now() - 2 * 86_400_000)).toBe("2d ago");
  });

  it("reports seconds for fresh entries", () => {
    expect(formatRelativeTime(Date.now() - 30_000)).toBe("just now");
  });
});

describe("formatDate", () => {
  it("returns a date string", () => {
    expect(typeof formatDate(Date.now())).toBe("string");
    expect(formatDate(Date.now()).length).toBeGreaterThan(0);
  });
});

describe("pluralize", () => {
  it("singularises with an explicit override", () => {
    expect(pluralize(1, "track")).toBe("1 track");
  });

  it("pluralises by default", () => {
    expect(pluralize(3, "track")).toBe("3 tracks");
  });
});

describe("formatCount", () => {
  it("formats numbers with grouping", () => {
    expect(formatCount(12345)).toBe(new Intl.NumberFormat().format(12345));
  });

  it("falls back to a dash when the count is missing", () => {
    expect(formatCount(undefined)).toBe("—");
  });
});

describe("truncate", () => {
  it("truncates long strings with an ellipsis", () => {
    expect(truncate("abcdefgh", 5)).toBe("abcd…");
  });

  it("keeps short strings intact", () => {
    expect(truncate("hi", 10)).toBe("hi");
  });
});
