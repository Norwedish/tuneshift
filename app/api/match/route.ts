import { fail, ok, readJson } from "@/lib/api/respond";
import { enforceRateLimit, matchLimiter } from "@/lib/api/limiters";
import { findMatches } from "@/lib/conversion/match";
import { AppError } from "@/lib/errors";
import { matchRequestSchema } from "@/lib/validation/schemas";
import type { MatchResponse } from "@/types/api";
import type { Track } from "@/types/music";

export const dynamic = "force-dynamic";

/**
 * Match a single track. The playlist/album converters call this once per
 * track (in small batches from the client) so progress is visible, failures
 * are isolated, and a single track can be retried without redoing the set.
 */
export async function POST(request: Request) {
  try {
    enforceRateLimit(matchLimiter, request);

    let body: unknown;
    try {
      body = await readJson(request);
    } catch {
      throw new AppError({
        code: "invalid_request",
        message: "We couldn't read that request.",
      });
    }

    const parsed = matchRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_request",
        message: "That track metadata is incomplete.",
        hint: parsed.error.issues[0]?.message,
      });
    }

    const track = parsed.data.track as Track;

    if (track.platform === parsed.data.destination) {
      throw new AppError({
        code: "invalid_request",
        message: "That track is already on the destination platform.",
        hint: "Pick the opposite platform to convert it.",
      });
    }

    const match = await findMatches(track, parsed.data.destination, {
      limit: parsed.data.limit ?? 10,
    });

    return ok<MatchResponse>({ destination: parsed.data.destination, match });
  } catch (error) {
    return fail(error);
  }
}
