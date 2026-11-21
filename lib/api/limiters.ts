import { RateLimiter } from "@/lib/rate-limit";
import { env } from "@/lib/config/env";

export { enforceRateLimit, clientKey } from "@/lib/rate-limit";

/** Lazy so the env override applies after .env is loaded. */
let instance: RateLimiter | undefined;

export function apiLimiter(): RateLimiter {
  if (!instance) instance = new RateLimiter(env.rateLimitPerMinute, 60_000);
  return instance;
}

export const searchLimiter = new RateLimiter(30, 60_000);
export const matchLimiter = new RateLimiter(180, 60_000);
export const resolveLimiter = new RateLimiter(40, 60_000);
