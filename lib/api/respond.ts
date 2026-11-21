import { NextResponse } from "next/server";
import { isAppError, toPublicError } from "@/lib/errors";

export const NO_STORE = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export function ok<T>(data: T, headers: Record<string, string> = {}): NextResponse {
  return NextResponse.json(data, {
    status: 200,
    headers: { ...NO_STORE, ...headers },
  });
}

export function fail(error: unknown): NextResponse {
  const body = toPublicError(error);
  const status = isAppError(error) ? error.status : 500;

  if (!isAppError(error)) {
    console.error("[tuneshift] unhandled route error", error);
  }

  const headers: Record<string, string> = { ...NO_STORE };
  if (isAppError(error) && error.retryAfterSeconds) {
    headers["Retry-After"] = String(error.retryAfterSeconds);
  }

  return NextResponse.json({ error: body }, { status, headers });
}

/** Parses a JSON body without letting a malformed one throw a 500. */
export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error("Expected application/json");
  }
  const text = await request.text();
  if (!text || text.length > 100_000) throw new Error("Empty or oversized body");
  return JSON.parse(text) as unknown;
}
