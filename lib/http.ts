import { AppError } from "./errors";

const DEFAULT_TIMEOUT_MS = 9_000;
const MAX_ATTEMPTS = 3;

export interface HttpOptions extends RequestInit {
  timeoutMs?: number;
  /** Retries on 429 and 5xx with exponential backoff. Default 2. */
  retries?: number;
  platform?: string;
  /** Short label used in error messages, e.g. "Spotify search". */
  label?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text.slice(0, 500);
  }
}

/**
 * Thin fetch wrapper: hard timeout, bounded retries, and provider errors
 * translated into AppError so routes never leak upstream internals.
 */
export async function httpJson<T>(url: string, options: HttpOptions = {}): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 2,
    platform,
    label = "The music service",
    ...init
  } = options;

  let lastError: AppError | undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(init.headers ?? {}),
        },
      });

      if (response.ok) {
        return (await readBody(response)) as T;
      }

      const body = await readBody(response);
      const bodyMessage =
        body && typeof body === "object"
          ? ((body as { error?: { message?: string } | string }).error as
              | { message?: string }
              | string
              | undefined)
          : undefined;
      const upstreamMessage =
        typeof bodyMessage === "string" ? bodyMessage : bodyMessage?.message;

      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "2");
        const wait = Number.isFinite(retryAfter) ? Math.min(retryAfter, 10) : 2;
        if (attempt < retries) {
          await sleep(wait * 1000);
          continue;
        }
        throw new AppError({
          code: "rate_limited",
          message: `${label} is rate-limiting us right now.`,
          hint: "Wait a few seconds and try again. Cached results still work.",
          platform,
          retryAfterSeconds: wait,
        });
      }

      if (response.status === 401 || response.status === 403) {
        throw new AppError({
          code: response.status === 401 ? "unauthorized" : "private_resource",
          message:
            response.status === 401
              ? `${label} rejected our credentials.`
              : `This content isn't available to read from ${label}.`,
          hint:
            response.status === 401
              ? "Check the API credentials in your environment variables."
              : "The item may be private, region-locked or deleted.",
          platform,
          status: 502,
        });
      }

      if (response.status === 404) {
        throw new AppError({
          code: "not_found",
          message: `We couldn't find that on ${label}.`,
          hint: "It may have been removed, or the link may be incomplete.",
          platform,
        });
      }

      if (response.status >= 500) {
        lastError = new AppError({
          code: "upstream_error",
          message: `${label} is having a moment.`,
          hint: "This is upstream, not you. Try again shortly.",
          platform,
          detail: upstreamMessage,
        });
        if (attempt < retries) {
          await sleep(400 * 2 ** attempt);
          continue;
        }
        throw lastError;
      }

      throw new AppError({
        code: "invalid_request",
        message: `${label} rejected the request.`,
        hint: upstreamMessage ?? undefined,
        platform,
        detail: upstreamMessage,
      });
    } catch (error) {
      if (error instanceof AppError) {
        if (error.code !== "upstream_error") throw error;
        lastError = error;
        continue;
      }
      const aborted = error instanceof DOMException && error.name === "AbortError";
      lastError = new AppError({
        code: aborted ? "timeout" : "network",
        message: aborted
          ? `${label} took too long to respond.`
          : `We couldn't reach ${label}.`,
        hint: "Check your connection and try again.",
        platform,
      });
      if (attempt < retries) {
        await sleep(400 * 2 ** attempt);
        continue;
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw (
    lastError ??
    new AppError({
      code: "network",
      message: `We couldn't reach ${label}.`,
      platform,
    })
  );
}

export function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  return search.toString();
}
