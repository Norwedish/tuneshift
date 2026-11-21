import Link from "next/link";
import { Disc3, Link2, ListMusic, type LucideIcon } from "lucide-react";

const ACTIONS: Array<{
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  meta: string;
}> = [
  {
    href: "/convert",
    icon: Link2,
    title: "Convert a link",
    description: "Paste any Spotify or YouTube Music link. Get the best counterpart with alternatives.",
    meta: "track · album · playlist",
  },
  {
    href: "/playlists",
    icon: ListMusic,
    title: "Move a playlist",
    description: "Match every track in order, review the uncertain ones, and export the result.",
    meta: "order preserved",
  },
  {
    href: "/albums",
    icon: Disc3,
    title: "Shift an album",
    description: "Full track listing with per-track matches and retries for anything that fails.",
    meta: "tracklist intact",
  },
];

export function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {ACTIONS.map((action, index) => (
        <Link
          key={action.href}
          href={action.href}
          className="lift group relative flex flex-col justify-between overflow-hidden card p-4"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-full border border-pine/25 bg-pine/[0.06] text-pine">
                <action.icon className="size-4" aria-hidden />
              </span>
              <span className="font-mono text-[15px] uppercase tracking-[0.14em] text-faint">
                {action.meta}
              </span>
            </div>
            <h3 className="mt-3.5 text-[16px] font-medium text-ink">{action.title}</h3>
            <p className="mt-1 text-[16px] leading-relaxed text-muted">{action.description}</p>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[15px] font-medium text-pine">
            Open
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              />
            </svg>
          </div>
        </Link>
      ))}
    </div>
  );
}
