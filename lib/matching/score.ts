import type {
  Confidence,
  MatchCandidate,
  MatchResult,
  ScoreBreakdown,
  Track,
} from "@/types/music";
import {
  RECORDING_LEVEL_TAGS,
  type VersionTag,
  contentTokens,
  normalize,
  parseTitle,
  stripDiacritics,
} from "./normalize";

export const WEIGHTS = {
  title: 0.37,
  artist: 0.26,
  album: 0.07,
  duration: 0.16,
  version: 0.14,
} as const;

const DURATION_SIGMA_SECONDS = 18;
const MIN_CANDIDATE_SCORE = 0.28;

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = new Array<number>(b.length + 1);
  let current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) previous[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    const charA = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j += 1) {
      const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;
      const deletion = (previous[j] ?? 0) + 1;
      const insertion = (current[j - 1] ?? 0) + 1;
      const substitution = (previous[j - 1] ?? 0) + cost;
      current[j] = Math.min(deletion, insertion, substitution);
    }
    const swap = previous;
    previous = current;
    current = swap;
  }

  return previous[b.length] ?? 0;
}

export function levenshteinRatio(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - levenshtein(a, b) / longest;
}

function bigrams(value: string): Map<string, number> {
  const map = new Map<string, number>();
  const padded = ` ${value} `;
  for (let i = 0; i < padded.length - 1; i += 1) {
    const gram = padded.slice(i, i + 2);
    map.set(gram, (map.get(gram) ?? 0) + 1);
  }
  return map;
}

export function bigramDice(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const first = bigrams(a);
  const second = bigrams(b);
  let overlap = 0;
  let total = 0;
  for (const [gram, count] of first) {
    total += count;
    const other = second.get(gram);
    if (other) overlap += Math.min(count, other);
  }
  for (const count of second.values()) total += count;
  if (total === 0) return 0;
  return (2 * overlap) / total;
}

export function tokenContainment(a: string, b: string): number {
  const first = new Set(contentTokens(a));
  const second = new Set(contentTokens(b));
  if (first.size === 0 || second.size === 0) return 0;
  let shared = 0;
  for (const token of first) if (second.has(token)) shared += 1;
  return shared / Math.min(first.size, second.size);
}

/** Similarity for human-readable strings (titles, albums). */
export function stringSimilarity(a: string, b: string): number {
  const first = normalize(a);
  const second = normalize(b);
  if (!first || !second) return 0;
  if (first === second) return 1;

  const dice = bigramDice(first, second);
  const lev = levenshteinRatio(first, second);
  let score = 0.55 * dice + 0.45 * lev;

  const containment = tokenContainment(first, second);
  if (containment === 1) {
    const shorter = first.length <= second.length ? first : second;
    const longer = shorter === first ? second : first;
    if (longer.includes(shorter) && shorter.length >= 3) {
      // "Blinding Lights" vs "Blinding Lights Remastered" — same song name,
      // the suffix is a version detail handled elsewhere.
      score = Math.max(score, 0.9);
    } else if (contentTokens(shorter).length >= 2) {
      score = Math.max(score, 0.84);
    }
  } else if (containment >= 0.66) {
    score = Math.max(score, 0.72);
  }

  return clamp(score);
}

/** Best pairwise match between two artist lists. */
export function artistSimilarity(source: string[], candidate: string[]): number {
  if (source.length === 0 || candidate.length === 0) return 0.3;

  let best = 0;
  for (const left of source) {
    for (const right of candidate) {
      const a = normalize(stripDiacritics(left));
      const b = normalize(stripDiacritics(right));
      if (!a || !b) continue;

      let pair = stringSimilarity(a, b);
      if (a === b) pair = 1;
      // "The Weeknd" vs "Weeknd" or "Calvin Harris" vs "Calvin Harris, Dua Lipa"
      else if (contentTokens(a).length > 0 && contentTokens(b).length > 0) {
        pair = Math.max(pair, tokenContainment(a, b) * 0.95);
      }
      if (pair > best) best = pair;
    }
  }
  return best;
}

export function durationSimilarity(sourceMs?: number, candidateMs?: number): number {
  if (!sourceMs || !candidateMs || sourceMs <= 0 || candidateMs <= 0) return 0.6;
  const diffSeconds = Math.abs(sourceMs - candidateMs) / 1000;
  if (diffSeconds <= 2) return 1;
  return clamp(Math.exp(-(diffSeconds * diffSeconds) / (2 * DURATION_SIGMA_SECONDS ** 2)));
}

function versionPenalty(tags: VersionTag[]): number {
  if (tags.length === 0) return 0;
  let penalty = 0;
  for (const tag of tags) {
    if (tag === "cover") penalty = Math.max(penalty, 0.8);
    else if (RECORDING_LEVEL_TAGS.has(tag)) penalty += 0.55;
    else penalty += 0.12;
  }
  return Math.min(0.9, penalty);
}

/**
 * Two recordings are comparable when their recording-level tags agree.
 * A studio original should never beat a studio original just because both
 * are titled the same.
 */
export function versionSimilarity(sourceTags: VersionTag[], candidateTags: VersionTag[]): number {
  const sourceSet = new Set(sourceTags);
  const candidateSet = new Set(candidateTags);

  const sourceRecording = [...sourceSet].filter((tag) => RECORDING_LEVEL_TAGS.has(tag));
  const candidateRecording = [...candidateSet].filter((tag) => RECORDING_LEVEL_TAGS.has(tag));

  if (sourceRecording.length === 0 && candidateRecording.length === 0) {
    const minorExtra = [...candidateSet].filter((tag) => !RECORDING_LEVEL_TAGS.has(tag));
    return clamp(1 - versionPenalty(minorExtra) * 0.4);
  }

  if (
    sourceRecording.length === candidateRecording.length &&
    sourceRecording.every((tag) => candidateSet.has(tag))
  ) {
    // Same recording variant; only mastering/edition tags can still differ.
    const minorExtra = [...candidateSet].filter((tag) => !RECORDING_LEVEL_TAGS.has(tag));
    const minorMissing = [...sourceSet].filter((tag) => !RECORDING_LEVEL_TAGS.has(tag));
    const minorMismatch = Math.abs(minorExtra.length - minorMissing.length);
    return clamp(1 - minorMismatch * 0.05);
  }

  if (sourceRecording.length === 0) {
    return clamp(1 - versionPenalty(candidateRecording));
  }
  if (candidateRecording.length === 0) {
    return clamp(1 - versionPenalty(sourceRecording) * 0.9);
  }

  const overlap = sourceRecording.filter((tag) => candidateSet.has(tag)).length;
  const union = new Set([...sourceRecording, ...candidateRecording]).size;
  return clamp((overlap / union) * 0.75);
}

export function confidenceFor(score: number): Confidence {
  if (score >= 0.83) return "excellent";
  if (score >= 0.7) return "good";
  if (score >= 0.52) return "possible";
  return "low";
}

const CONFIDENCE_ORDER: Confidence[] = ["low", "possible", "good", "excellent"];

function downgrade(confidence: Confidence): Confidence {
  const index = CONFIDENCE_ORDER.indexOf(confidence);
  return CONFIDENCE_ORDER[Math.max(0, index - 1)] ?? "low";
}

function formatDelta(ms: number): string {
  const seconds = Math.round(Math.abs(ms) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

export function primaryArtist(track: Track): string {
  return track.artists[0]?.name ?? track.channelTitle ?? "";
}

/** Score one candidate against the source track. Pure and deterministic. */
export function scoreCandidate(source: Track, candidate: Track): MatchCandidate {
  const sourceTitle = parseTitle(source.title);
  const candidateTitle = parseTitle(candidate.title);

  const title = stringSimilarity(sourceTitle.base, candidateTitle.base);
  const artist = artistSimilarity(
    source.artists.map((item) => item.name),
    candidate.artists.map((item) => item.name),
  );
  const album =
    source.album?.name && candidate.album?.name
      ? stringSimilarity(source.album.name, candidate.album.name)
      : 0.7;
  const duration = durationSimilarity(source.durationMs, candidate.durationMs);
  const version = versionSimilarity(sourceTitle.versionTags, candidateTitle.versionTags);

  const breakdown: ScoreBreakdown = { title, artist, album, duration, version };

  let score =
    title * WEIGHTS.title +
    artist * WEIGHTS.artist +
    album * WEIGHTS.album +
    duration * WEIGHTS.duration +
    version * WEIGHTS.version;

  const reasons: string[] = [];
  const warnings: string[] = [];

  if (title >= 0.97) reasons.push("Title matches exactly");
  else if (title >= 0.85) reasons.push("Title matches closely");
  else if (title < 0.6) warnings.push("Title is quite different");

  if (artist >= 0.97) reasons.push("Same artist");
  else if (artist >= 0.8) reasons.push("Artist name matches");
  else if (artist < 0.5) warnings.push("Artist doesn't line up");

  if (source.album?.name && candidate.album?.name) {
    if (album >= 0.9) reasons.push("Same album");
    else if (album < 0.45) warnings.push("Different album");
  }

  if (source.durationMs && candidate.durationMs) {
    const delta = Math.abs(source.durationMs - candidate.durationMs);
    if (delta <= 3000) reasons.push("Duration matches within 3s");
    else if (delta <= 8000) reasons.push("Duration is close");
    else warnings.push(`Duration differs by ${formatDelta(delta)}`);
  }

  // Same recording variant.
  const sourceRecording = sourceTitle.versionTags.filter((tag) => RECORDING_LEVEL_TAGS.has(tag));
  const candidateRecording = candidateTitle.versionTags.filter((tag) =>
    RECORDING_LEVEL_TAGS.has(tag),
  );
  if (version >= 0.98 && sourceRecording.length > 0) {
    reasons.push(`Both are the ${sourceRecording.join(" / ")} version`);
  }
  if (sourceRecording.length === 0 && candidateRecording.length > 0) {
    warnings.push(
      `Candidate is a ${candidateRecording.join(" / ")} version, source is the studio recording`,
    );
  } else if (sourceRecording.length > 0 && candidateRecording.length === 0) {
    warnings.push("Candidate looks like the studio version, source is not");
  } else if (
    sourceRecording.length > 0 &&
    candidateRecording.length > 0 &&
    version < 0.9
  ) {
    warnings.push(
      `Version mismatch: source is ${sourceRecording.join(" / ")}, candidate is ${candidateRecording.join(" / ")}`,
    );
  }

  if (version < 0.4) score -= 0.06;
  if (title >= 0.95 && artist >= 0.95 && duration >= 0.98) score += 0.03;
  if (candidate.videoKind === "topic") score += 0.02;
  if (candidate.videoKind === "video") {
    score -= 0.03;
    warnings.push("Regular YouTube upload, not a YouTube Music track");
  }
  if (candidate.explicit !== undefined && source.explicit !== undefined && candidate.explicit !== source.explicit) {
    warnings.push(
      candidate.explicit ? "Candidate is the explicit version" : "Candidate is the clean version",
    );
    score -= 0.015;
  }
  if (
    candidate.durationMs &&
    source.durationMs &&
    candidate.durationMs < 60_000 &&
    source.durationMs > 120_000
  ) {
    score -= 0.2;
    warnings.push("Candidate is far too short — likely a clip or interlude");
  }
  if (candidate.inferred) {
    warnings.push("Metadata inferred from the video title");
  }

  score = clamp(score);

  return {
    track: candidate,
    score,
    breakdown,
    confidence: confidenceFor(score),
    reasons,
    warnings,
  };
}

export function rankMatches(
  source: Track,
  candidates: Track[],
  options: { limit?: number } = {},
): MatchResult {
  const limit = options.limit ?? 8;
  const seen = new Set<string>();

  const scored: MatchCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.platform}:${candidate.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (candidate.platform === source.platform && candidate.id === source.id) continue;
    const scoredCandidate = scoreCandidate(source, candidate);
    if (scoredCandidate.score >= MIN_CANDIDATE_SCORE) scored.push(scoredCandidate);
  }

  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) return b.score - a.score;
    return (a.track.durationMs ?? 0) - (b.track.durationMs ?? 0);
  });

  const top = scored.slice(0, limit);
  const best = top[0] ?? null;

  if (!best) {
    return { best: null, candidates: [], confidence: "low", score: 0 };
  }

  let confidence = best.confidence;

  // Two near-identical scores means the metadata can't decide. Say so.
  const runnerUp = top[1];
  if (runnerUp && best.score < 0.9 && best.score - runnerUp.score < 0.045) {
    confidence = downgrade(confidence);
    if (!best.warnings.includes("Another match scores almost identically")) {
      best.warnings.push("Another match scores almost identically");
    }
  }
  if (best.score < 0.52) confidence = "low";

  best.confidence = confidence;

  return { best, candidates: top, confidence, score: best.score };
}
