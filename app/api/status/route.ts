import { fail, ok } from "@/lib/api/respond";
import { providerStatus } from "@/lib/providers";
import { appCache } from "@/lib/cache";
import type { StatusResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cached = appCache.get("provider-status") as StatusResponse["providers"] | undefined;
    const providers = cached ?? (await providerStatus());
    if (!cached) appCache.set("provider-status", providers, 60_000);

    const body: StatusResponse = {
      providers,
      cacheTtlSeconds: 300,
      version: process.env.npm_package_version ?? "1.0.0",
    };
    return ok(body);
  } catch (error) {
    return fail(error);
  }
}
