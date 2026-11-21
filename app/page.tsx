import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";
import { QuickActions } from "@/components/home/quick-actions";
import { RecentStrip } from "@/components/home/recent-strip";
import { ProviderBanner } from "@/components/providers/provider-banner";
import { ShiftStrip } from "@/components/ui/shift-strip";

export default function HomePage() {
  return (
    <>
      <section className="container-page pt-8 sm:pt-12 lg:pt-16">
        <p className="flex items-center gap-2 font-mono text-[14px] uppercase tracking-[0.16em] text-muted">
          <span aria-hidden className="inline-block size-1.5 rotate-45 bg-saffron" />
          Spotify &larr;&rarr; YouTube Music
        </p>

        <h1 className="display mt-4 max-w-3xl text-[clamp(2.75rem,9vw,4.6rem)] text-ink">
          Move music
          <br />
          <span className="font-extrabold text-pine">between platforms.</span>
        </h1>

        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
          Paste a song link. Get the same track on the other service, with the alternatives it
          considered.
        </p>

        <div className="mt-7 max-w-2xl">
          <SearchBar autoFocus />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px] text-muted">
          <span>No account needed</span>
          <span aria-hidden className="text-line-strong">
            &middot;
          </span>
          <span>Official APIs only</span>
          <span aria-hidden className="text-line-strong">
            &middot;
          </span>
          <Link href="/setup" className="text-pine underline underline-offset-4">
            Setup
          </Link>
        </div>

        <div className="mt-7">
          <ProviderBanner />
        </div>
      </section>

      <section className="container-page mt-10 sm:mt-14">
        <QuickActions />
      </section>

      <RecentStrip />

      <section className="container-page mt-12 sm:mt-16">
        <div className="card p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-[26px] leading-tight text-ink sm:text-[30px]">
              How sure are we?
            </h2>
            <Link
              href="/convert"
              className="inline-flex items-center gap-1.5 text-[16px] font-medium text-pine hover:underline"
            >
              Try a link
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted">
            Every result gets a score from title, artist, album, duration and version. Low scores are
            labelled weak instead of being passed off as exact.
          </p>

          <ShiftStrip segments={48} height="sm" className="mt-4 opacity-40" />

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Excellent", "Everything lines up."],
              ["Good", "One weaker field."],
              ["Possible", "Your call - usually a regional or re-uploaded version."],
              ["Weak", "Kept, but flagged. Nothing is saved as approved."],
            ].map(([label, body]) => (
              <li key={label} className="flex gap-3 border-t border-line pt-3">
                <span className="w-24 shrink-0 font-mono text-[15px] uppercase tracking-[0.1em] text-ink-2">
                  {label}
                </span>
                <span className="text-[16px] leading-relaxed text-muted">{body}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="container-page mt-14 pb-8">
        <div className="rule" />
        <div className="flex flex-col gap-3 pt-4 text-[15px] leading-relaxed text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            History and favorites stay in <span className="text-ink-2">your browser</span>.
          </p>
          <div className="flex flex-wrap items-center gap-5 text-[15px]">
            <Link href="/setup" className="hover:text-ink">
              API setup
            </Link>
            <Link href="/settings" className="hover:text-ink">
              Privacy
            </Link>
            <span className="inline-flex items-center gap-1 text-faint">
              Docs
              <ArrowUpRight className="size-3.5" aria-hidden />
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}