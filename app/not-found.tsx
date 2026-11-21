import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex size-14 items-center justify-center card">
        <Compass className="size-6 text-muted" aria-hidden />
      </div>
      <p className="display mt-6 text-[clamp(3rem,10vw,5rem)] text-ink">404</p>
      <h1 className="mt-2 text-[clamp(1.6rem,4vw,2.2rem)] font-medium text-ink">
        Lost in the mix
      </h1>
      <p className="mt-3 max-w-md text-[16px] leading-relaxed text-muted">
        That page isn&apos;t part of the library. The track or collection you were after may have
        moved.
      </p>
      <div className="mt-7">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full btn-primary px-5 text-[16px] font-medium transition-[filter,box-shadow] duration-150"
        >
          Back to search
        </Link>
      </div>
    </div>
  );
}
