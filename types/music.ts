export type Platform = "spotify" | "youtube";
export type CollectionKind = "album" | "playlist";
export type EntityKind = "track" | CollectionKind;

export interface ArtistRef {
  id?: string;
  name: string;
}

export interface ArtworkRef {
  url: string;
  width?: number;
  height?: number;
}

export interface Track {
  id: string;
  platform: Platform;
  kind: "track";
  title: string;
  /** Secondary title (e.g. a YouTube video's parsed artist line). */
  subtitle?: string;
  artists: ArtistRef[];
  album?: { id?: string; name: string };
  durationMs?: number;
  artworkUrl?: string;
  url: string;
  explicit?: boolean;
  isrc?: string;
  year?: number;
  /**
   * YouTube only. `music` = surfaced from the Music category, `topic` = an
   * auto-generated artist/topic channel, `video` = a regular YouTube upload.
   */
  videoKind?: "music" | "topic" | "video";
  channelTitle?: string;
  /** True when metadata was inferred from a title string rather than a field. */
  inferred?: boolean;
}

export interface Collection {
  id: string;
  platform: Platform;
  kind: CollectionKind;
  title: string;
  description?: string;
  owner?: string;
  artworkUrl?: string;
  url: string;
  year?: number;
  trackCount: number;
  tracks: Track[];
  /** Number of tracks the provider reported but did not return. */
  unavailableCount?: number;
  /** True when we deliberately stopped before the full list. */
  truncated?: boolean;
}

export type Confidence = "excellent" | "good" | "possible" | "low";

export interface ScoreBreakdown {
  title: number;
  artist: number;
  album: number;
  duration: number;
  version: number;
}

export interface MatchCandidate {
  track: Track;
  score: number;
  breakdown: ScoreBreakdown;
  confidence: Confidence;
  reasons: string[];
  warnings: string[];
}

export interface MatchResult {
  best: MatchCandidate | null;
  candidates: MatchCandidate[];
  confidence: Confidence;
  /** 0–1 weighted total of the best candidate. */
  score: number;
}

export type ConversionStatus = "completed" | "partial" | "failed";

export interface HistoryEntry {
  id: string;
  createdAt: number;
  sourceUrl: string;
  sourcePlatform: Platform;
  destinationPlatform: Platform;
  kind: EntityKind;
  title: string;
  subtitle?: string;
  artworkUrl?: string;
  trackCount?: number;
  status: ConversionStatus;
  destinationUrl?: string;
  destinationTitle?: string;
  confidence?: Confidence;
  matchedCount?: number;
  uncertainCount?: number;
  failedCount?: number;
}

export interface FavoriteEntry {
  id: string;
  addedAt: number;
  platform: Platform;
  kind: EntityKind;
  title: string;
  subtitle?: string;
  artworkUrl?: string;
  url: string;
  durationMs?: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  reduceMotion: boolean;
  /** Hide results flagged explicit in provider metadata. */
  showExplicit: boolean;
}
