import { describe, expect, it } from "vitest";
import { AppError, isAppError, redactSecrets, toPublicError } from "@/lib/errors";

describe("AppError", () => {
  it("maps known codes to HTTP statuses", () => {
    expect(new AppError({ code: "not_configured", message: "Missing credentials" }).status).toBe(503);
    expect(new AppError({ code: "rate_limited", message: "Slow down" }).status).toBe(429);
    expect(new AppError({ code: "no_match", message: "Nothing found" }).status).toBe(404);
    expect(new AppError({ code: "internal", message: "Boom" }).status).toBe(500);
  });

  it("allows explicit status overrides", () => {
    expect(new AppError({ code: "not_found", message: "Nope", status: 404 }).status).toBe(404);
  });

  it("exposes only the public error shape", () => {
    const error = new AppError({
      code: "rate_limited",
      message: "Too many requests",
      hint: "Wait a minute.",
      retryAfterSeconds: 30,
    });

    expect(isAppError(error)).toBe(true);
    expect(toPublicError(error)).toEqual({
      code: "rate_limited",
      message: "Too many requests",
      hint: "Wait a minute.",
      platform: undefined,
      retryAfterSeconds: 30,
    });
  });

  it("falls back to an internal error for unexpected throws", () => {
    const publicError = toPublicError(new Error("boom"));
    expect(publicError.code).toBe("internal");
    expect(publicError.message).toBe("Something went wrong on our side.");
  });
});

describe("redactSecrets", () => {
  it("strips tokens and keys from flat strings", () => {
    const result = redactSecrets(
      "https://api.spotify.com/v1/tracks?access_token=super-secret&market=SE",
    ) as string;
    expect(result).toContain("[redacted]");
    expect(result).not.toContain("super-secret");
  });

  it("redacts nested objects without touching safe keys", () => {
    const result = redactSecrets({
      url: "https://api.spotify.com/v1/search?q=sun&api_key=abc123",
      keep: "hello",
    }) as { url: string; keep: string };

    expect(result.url).toContain("[redacted]");
    expect(result.keep).toBe("hello");
  });
});
