"use client";

import Link from "next/link";
import { useProviderStatus } from "@/components/providers/status-provider";
import { StatusDot } from "@/components/ui/badge";
import { platformLabel } from "@/lib/utils/platform";
import type { Platform } from "@/types/music";

const ENV_KEYS: Array<{ key: string; title: string; body: string }> = [
  {
    key: "YOUTUBE_API_KEY",
    title: "YouTube Data API v3",
    body: "Powers the destination catalogue and playlist reads.",
  },
  {
    key: "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET",
    title: "Spotify Web API",
    body: "Powers the source catalogue and the token exchange.",
  },
];

const LINK_CLASS =
  "inline-flex h-9 items-center rounded-full btn-primary px-4 text-[15px] font-medium transition-[filter,box-shadow] duration-150";

export function SetupView() {
  const { status, loading } = useProviderStatus();

  const platforms: Array<{ platform: Platform; label: string }> = [
    { platform: "spotify", label: platformLabel("spotify") },
    { platform: "youtube", label: platformLabel("youtube") },
  ];

  return (
    <div className="container-page pt-8 lg:pt-12">
      <header className="max-w-2xl">
        <p className="label">Configuration</p>
        <h1 className="display mt-2 text-[clamp(2.2rem,6vw,3.4rem)] text-ink">Setup</h1>
        <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted">
          TuneShift runs on two official APIs. Add credentials to enable live search and matching;
          until then the app explains what is missing instead of showing invented results.
        </p>
      </header>

      <div className="mt-8 grid max-w-2xl gap-4">
        <section className="card p-5">
          <h2 className="text-[17px] font-medium text-ink">Provider status</h2>
          <div className="mt-4 space-y-2.5">
            {platforms.map(({ platform, label }) => {
              const state = status?.providers?.[platform];
              const configured = state?.configured;
              const ok = state?.ok;
              return (
                <div
                  key={platform}
                  className="flex items-center justify-between gap-3 rounded-[18px] border border-line bg-surface-2/60 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <StatusDot tone={ok ? "ok" : configured === false ? "muted" : "warn"} />
                    <span className="truncate text-[16px] font-medium text-ink">{label}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[13px] uppercase tracking-[0.1em] text-faint">
                    {loading ? "checking" : ok ? "Connected" : configured ? "Needs attention" : "Not set"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-faint">
            Status refreshes from the server on load. Cached for {status?.cacheTtlSeconds ?? 300}s.
          </p>
        </section>

        <section className="card p-5">
          <h2 className="text-[17px] font-medium text-ink">Add your own keys</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">
            Keys are read on the server and never shipped to the browser. Create a{" "}
            <span className="font-mono text-ink-2">.env.local</span> in the project root and restart
            the dev server.
          </p>
          <ul className="mt-4 space-y-3">
            {ENV_KEYS.map((entry) => (
              <li key={entry.key} className="rounded-[18px] border border-line bg-surface-2/60 p-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[16px] font-medium text-ink">{entry.title}</p>
                  <code className="rounded-[10px] bg-surface px-2 py-0.5 font-mono text-[13px] text-ink-2">
                    {entry.key}
                  </code>
                </div>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{entry.body}.</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-[17px] font-medium text-ink">How matching works without keys</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-muted">
            Without credentials the converter shows the setup state and points you here. With
            credentials it scores every candidate on title, artist, album, duration and version.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/convert" className={LINK_CLASS}>
              Open the converter
            </Link>
            <Link
              href="/settings"
              className="inline-flex h-[38px] items-center rounded-full btn-secondary px-4 text-[15px] font-medium transition-colors duration-150"
            >
              Open settings
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
