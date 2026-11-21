export type VersionTag =
  | "live"
  | "remix"
  | "acoustic"
  | "instrumental"
  | "karaoke"
  | "sped_up"
  | "slowed"
  | "extended"
  | "radio_edit"
  | "demo"
  | "cover"
  | "remaster"
  | "piano"
  | "orchestral"
  | "mono"
  | "clean";

/** Tags that describe a different *recording*, not just a different master. */
export const RECORDING_LEVEL_TAGS: ReadonlySet<VersionTag> = new Set<VersionTag>([
  "live",
  "remix",
  "acoustic",
  "instrumental",
  "karaoke",
  "sped_up",
  "slowed",
  "cover",
  "demo",
  "piano",
  "orchestral",
]);

const VERSION_RULES: ReadonlyArray<readonly [VersionTag, RegExp]> = [
  ["live", /\b(live|in concert|concert|unplugged|session|bbc)\b/],
  ["remix", /\b(remix|remixed|rmx|bootleg|flip|mashup)\b/],
  ["acoustic", /\b(acoustic|unplugged|stripped)\b/],
  ["instrumental", /\b(instrumental|backing track|no vocals)\b/],
  ["karaoke", /\b(karaoke|sing[\s-]?along)\b/],
  ["sped_up", /\b(sped[\s-]?up|speed[\s-]?up|nightcore)\b/],
  ["slowed", /\b(slowed|reverb|slowed\s*\+\s*reverb)\b/],
  ["extended", /\b(extended|club mix|long version)\b/],
  ["radio_edit", /\b(radio edit|radio version|single edit)\b/],
  ["demo", /\b(demo|rough mix|early take)\b/],
  ["cover", /\b(cover|tribute|in the style of)\b/],
  ["remaster", /\b(remaster|remastered|anniversary edition|\d{4} remaster)\b/],
  ["piano", /\b(piano version|piano)\b/],
  ["orchestral", /\b(orchestral|symphonic|strings version)\b/],
  ["mono", /\bmono\b/],
  ["clean", /\b(clean|radio friendly)\b/],
];

export interface ParsedTitle {
  /** Main title with version suffixes, features and noise removed. */
  base: string;
  versionTags: VersionTag[];
  featured: string[];
  raw: string;
}

const NOISE_BRACKETS =
  /\b(official\s*(music\s*)?(video|audio|visualizer|lyric\s*video)|lyric\s*video|with\s*lyrics|lyrics?|visualizer|hd|hq|4k|8k|m\/v|mv|explicit|clean\s*version|audio\s*only|full\s*song|prod\.?\s*by\s*[^)\]]+)\b/gi;

export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalize(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalize(value);
  return normalized ? normalized.split(" ") : [];
}

const STOPWORDS = new Set(["the", "a", "an", "and", "of", "feat", "ft", "featuring"]);

export function contentTokens(value: string): string[] {
  return tokenize(value).filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/**
 * Pull apart a track name into the parts that matter for matching.
 * Handles "Song (Live at Wembley)", "Song - Remastered 2011",
 * "Song feat. X", and the YouTube "Artist - Song (Official Video)" shape.
 */
export function parseTitle(raw: string): ParsedTitle {
  const original = raw.replace(/\s+/g, " ").trim();
  let working = original;

  // Drop trailing "- Topic" style channel noise that sometimes leaks into titles.
  working = working.replace(/\s*[-–—]\s*topic\s*$/i, "");

  // Feature credits can appear inside brackets or as a trailing dash clause.
  const featured: string[] = [];
  working = working.replace(
    /\s*[([]\s*(?:feat\.?|ft\.?|featuring|with)\s+([^)\]]+)[)\]]/gi,
    (_match, names: string) => {
      featured.push(names.trim());
      return "";
    },
  );
  working = working.replace(/\s+(?:feat\.?|ft\.?|featuring)\s+(.+)$/i, (_match, names: string) => {
    featured.push(names.trim());
    return "";
  });

  const versionTags: VersionTag[] = [];
  const collectTags = (fragment: string) => {
    const normalized = normalize(fragment);
    for (const [tag, pattern] of VERSION_RULES) {
      if (pattern.test(normalized)) versionTags.push(tag);
    }
  };

  // Bracket segments are the usual home of "(Remix)", "[Live]", "(Official Video)".
  const bracketMatches = working.match(/[([][^)\]]*[)\]]/g) ?? [];
  for (const fragment of bracketMatches) {
    collectTags(fragment);
    working = working.replace(fragment, " ");
  }

  // "- Remastered 2011" / " - Radio Edit" style suffixes.
  const dashParts = working.split(/\s+[-–—]\s+/);
  if (dashParts.length > 1) {
    const tail = dashParts.slice(1).join(" - ");
    collectTags(tail);
    const base = dashParts[0] ?? "";
    // Only treat the tail as a version suffix when it actually reads like one.
    if (versionTags.length > 0 || NOISE_BRACKETS.test(tail)) {
      working = base;
    }
  }

  // YouTube uploads often embed the artist in the title: "Artist - Song".
  working = working.replace(NOISE_BRACKETS, " ");

  const base = normalize(working);

  return {
    base: base || normalize(original),
    versionTags: unique(versionTags),
    featured: unique(featured),
    raw: original,
  };
}

/**
 * Best-effort split of a YouTube title into artist and song.
 * Only splits on a dash when the left side is plausibly an artist name.
 */
export function splitArtistTitle(raw: string): { artist?: string; title: string } {
  const cleaned = raw.replace(/\s+/g, " ").trim();
  const separators = [" - ", " – ", " — "];

  for (const separator of separators) {
    const index = cleaned.indexOf(separator);
    if (index <= 0) continue;

    const left = cleaned.slice(0, index).trim();
    const right = cleaned.slice(index + separator.length).trim();
    if (!right) continue;

    const leftTokens = tokenize(left);
    const looksLikeArtist =
      leftTokens.length > 0 &&
      leftTokens.length <= 8 &&
      !/\b(official|video|audio|lyrics|remix|live|album|mix|full|hd|4k)\b/.test(normalize(left)) &&
      !/\d{4}/.test(left);

    if (looksLikeArtist) {
      return { artist: left, title: right };
    }
  }

  return { title: cleaned };
}

export function stripChannelSuffix(channelTitle: string): string {
  return channelTitle.replace(/\s*-\s*topic$/i, "").trim();
}
