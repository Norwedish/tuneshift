export type ErrorCode =
  | "invalid_request"
  | "invalid_url"
  | "unsupported_url"
  | "unsupported_platform"
  | "not_configured"
  | "unauthorized"
  | "not_found"
  | "private_resource"
  | "rate_limited"
  | "upstream_error"
  | "timeout"
  | "network"
  | "no_match"
  | "internal";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  invalid_request: 400,
  invalid_url: 400,
  unsupported_url: 400,
  unsupported_platform: 400,
  not_configured: 503,
  unauthorized: 502,
  not_found: 404,
  private_resource: 403,
  rate_limited: 429,
  upstream_error: 502,
  timeout: 504,
  network: 502,
  no_match: 404,
  internal: 500,
};

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  hint?: string;
  status?: number;
  platform?: string;
  retryAfterSeconds?: number;
  detail?: unknown;
  cause?: unknown;
}

/**
 * Every failure that reaches the client is one of these: a stable code, a
 * human sentence, and an optional actionable hint. Nothing else is exposed.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly hint?: string;
  readonly platform?: string;
  readonly retryAfterSeconds?: number;
  readonly detail?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.status = options.status ?? STATUS_BY_CODE[options.code];
    this.hint = options.hint;
    this.platform = options.platform;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.detail = options.detail;
    if (options.cause) this.cause = options.cause;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      hint: this.hint,
      platform: this.platform,
      retryAfterSeconds: this.retryAfterSeconds,
    };
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

export function toPublicError(error: unknown): {
  code: ErrorCode;
  message: string;
  hint?: string;
  platform?: string;
  retryAfterSeconds?: number;
} {
  if (isAppError(error)) return error.toJSON();
  return {
    code: "internal",
    message: "Something went wrong on our side.",
    hint: "Try again in a moment. If it keeps happening, the provider may be unavailable.",
  };
}

/** Never let a token or secret reach a log line. */
export function redactSecrets(input: unknown): unknown {
  if (typeof input === "string") {
    return input
      .replace(/(access_token|refresh_token|client_secret|api_key|key)=([^&\s]+)/gi, "$1=[redacted]")
      .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]");
  }
  if (!input || typeof input !== "object") return input;
  if (Array.isArray(input)) return input.map(redactSecrets);
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      /token|secret|key|authorization/i.test(key) ? "[redacted]" : redactSecrets(value),
    ]),
  );
}
