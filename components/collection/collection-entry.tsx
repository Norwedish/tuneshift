"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/empty-state";
import { parseMusicLink } from "@/lib/validation/links";
import { cn } from "@/lib/utils/cn";

const KIND_COPY: Record<"album" | "playlist", { title: string; body: string }> = {
  album: {
    title: "Full album shifts",
    body: "Paste an album link. Every track is matched in order, with per-track review and retries.",
  },
  playlist: {
    title: "Playlist shifts",
    body: "Paste a playlist link. Tracks are matched in order and the result is exported.",
  },
};

/**
 * Collection entry point shared by /albums and /playlists. Keeps the copy
 * honest (we can't read arbitrary album pages) while still giving a real
 * conversion path: the link goes straight into the converter.
 */
export function CollectionEntry({ kind }: { kind: "album" | "playlist" }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const copy = KIND_COPY[kind];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    const parsed = parseMusicLink(trimmed);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    if (parsed.kind !== kind) {
      setError(`That link looks like a ${parsed.kind}, not a ${kind}. Double-check the source.`);
      return;
    }

    setError(null);
    router.push(`/convert?url=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="container-page pt-8 lg:pt-12">
      <header className="max-w-2xl">
        <p className="label">Collection shift</p>
        <h1 className="display mt-3 text-[clamp(2.2rem,6vw,3.4rem)] text-ink">
          Move a {kind}.
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-muted">{copy.body}</p>
      </header>

      <form
        onSubmit={submit}
        className="mt-8 max-w-2xl card p-2 transition-colors focus-within:border-pine/40"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex flex-1 items-center">
            <Link2 className="pointer-events-none absolute left-3.5 size-4 text-muted" aria-hidden />
            <Input
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
 setError(null);
              }}
              placeholder={
                kind === "album"
                  ? "Paste an album link, e.g. open.spotify.com/album/…"
                  : "Paste a playlist link, e.g. music.youtube.com/playlist?list=…"
              }
              aria-label={`${kind} link`}
              className="h-12 border-0 bg-transparent pl-10 pr-4 text-[16px] shadow-none focus:ring-0"
            />
          </div>
          <Button type="submit" disabled={value.trim().length === 0} className="h-12 px-5">
            {kind === "album" ? "Shift album" : "Shift playlist"}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </form>

      {error ? (
        <div className="mt-3">
          <InlineNotice tone="danger" title={error}>
            {kind === "album"
              ? "We couldn't read that album link."
              : "We couldn't read that playlist link."}
          </InlineNotice>
        </div>
      ) : null}

      <p className="mt-4 text-[15px] leading-relaxed text-faint">
        Works with album or playlist links from either platform. YouTube Music album pages aren&apos;t
        readable through the official API, so those arrive as playlist links.
      </p>
    </div>
  );
}
