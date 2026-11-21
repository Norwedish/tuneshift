import { fail, ok, readJson } from "@/lib/api/respond";
import { enforceRateLimit, resolveLimiter } from "@/lib/api/limiters";
import { resolveLink } from "@/lib/conversion/match";
import { AppError } from "@/lib/errors";
import { resolveRequestSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    enforceRateLimit(resolveLimiter, request);

    let body: unknown;
    try {
      body = await readJson(request);
    } catch {
      throw new AppError({
        code: "invalid_request",
        message: "We couldn't read that request.",
        hint: "Send a JSON body with a `url` field.",
      });
    }

    const parsed = resolveRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError({
        code: "invalid_request",
        message: "That link doesn't look usable.",
        hint: parsed.error.issues[0]?.message ?? "Paste a Spotify or YouTube Music link.",
      });
    }

    const result = await resolveLink(parsed.data.url, {
      metadataOnly: parsed.data.metadataOnly,
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
