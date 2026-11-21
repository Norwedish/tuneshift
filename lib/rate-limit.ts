import { AppError } from "./errors";

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window in-memory limiter. Per-process only, which is the right
 * trade-off for a public app with no database: it protects the upstream
 * providers from a single hot client, not from a botnet.
 */
export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs = 60_000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(key: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      this.sweep(now);
      return { allowed: true, remaining: this.limit - 1, retryAfterSeconds: 0 };
    }

    if (bucket.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      };
    }

    bucket.count += 1;
    return { allowed: true, remaining: this.limit - bucket.count, retryAfterSeconds: 0 };
  }

  private sweep(now: number) {
    if (this.buckets.size < 2000) return;
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "local";
}

export function enforceRateLimit(limiter: RateLimiter, request: Request): void {
  const result = limiter.check(clientKey(request));
  if (!result.allowed) {
    throw new AppError({
      code: "rate_limited",
      message: "You're moving fast. Take a breath and try again shortly.",
      hint: `Try again in ${result.retryAfterSeconds} seconds.`,
      retryAfterSeconds: result.retryAfterSeconds,
    });
  }
}
