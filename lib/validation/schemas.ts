import { z } from "zod";

export const platformSchema = z.enum(["spotify", "youtube"]);

export const searchRequestSchema = z.object({
  q: z.string().trim().min(1, "Type something to search").max(160),
  platform: platformSchema.optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const artistSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(1).max(200),
});

/**
 * Tracks are echoed back from the server, but a client can still post a
 * hand-crafted body — so every field the matcher reads is bounded here.
 */
export const trackInputSchema = z
  .object({
    id: z.string().min(1).max(64),
    platform: platformSchema,
    kind: z.literal("track"),
    title: z.string().trim().min(1).max(300),
    subtitle: z.string().max(300).optional(),
    artists: z.array(artistSchema).min(1).max(20),
    album: z
      .object({
        id: z.string().max(64).optional(),
        name: z.string().max(300),
      })
      .optional(),
    durationMs: z.number().int().nonnegative().max(3_600_000).optional(),
    artworkUrl: z.string().url().max(1000).optional(),
    url: z.string().max(1000),
    explicit: z.boolean().optional(),
    isrc: z.string().max(20).optional(),
    year: z.number().int().min(1900).max(2100).optional(),
    videoKind: z.enum(["music", "topic", "video"]).optional(),
    channelTitle: z.string().max(200).optional(),
    inferred: z.boolean().optional(),
  })
  .passthrough();

export const matchRequestSchema = z.object({
  track: trackInputSchema,
  destination: platformSchema,
  limit: z.number().int().min(1).max(15).optional(),
});

export const resolveRequestSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  /** Set to true to skip matching and only read the entity. */
  metadataOnly: z.boolean().optional(),
});

export const collectionMatchRequestSchema = z.object({
  tracks: z.array(trackInputSchema).min(1).max(20),
  destination: platformSchema,
});

export type MatchRequest = z.infer<typeof matchRequestSchema>;
export type ResolveRequest = z.infer<typeof resolveRequestSchema>;
