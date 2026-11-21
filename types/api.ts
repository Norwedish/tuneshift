import type {
  Collection,
  CollectionKind,
  MatchResult,
  Platform,
  Track,
} from "@/types/music";

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    hint?: string;
    platform?: string;
    retryAfterSeconds?: number;
  };
}

export interface ProviderState {
  configured: boolean;
  ok: boolean;
  message?: string;
  latencyMs?: number;
  label: string;
}

export interface StatusResponse {
  providers: Record<Platform, ProviderState>;
  cacheTtlSeconds: number;
  version: string;
}

export interface SearchResponse {
  query: string;
  results: Track[];
  counts: Partial<Record<Platform, number>>;
  errors: Partial<Record<Platform, ApiErrorBody["error"]>>;
}

export type ResolveResponse =
  | {
      kind: "track";
      sourcePlatform: Platform;
      destinationPlatform: Platform;
      track: Track;
      match: MatchResult;
    }
  | {
      kind: CollectionKind;
      sourcePlatform: Platform;
      destinationPlatform: Platform;
      collection: Collection;
    };

export interface MatchResponse {
  destination: Platform;
  match: MatchResult;
}
