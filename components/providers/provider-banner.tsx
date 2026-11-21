"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { useProviderStatus } from "@/components/providers/status-provider";

export function ProviderBanner() {
  const { status, loading } = useProviderStatus();
  const [dismissed, setDismissed] = useState(false);

  if (loading || dismissed || !status) return null;

  const missing = (Object.entries(status.providers) as Array<
    [keyof typeof status.providers, (typeof status.providers)["spotify"]]
  >).filter(([, value]) => !value.ok);

  if (missing.length === 0) return null;

  const labels = missing.map(([, value]) => value.label).join(" and ");

  return (
    <div className="mt-6 flex items-start gap-3 rounded-[18px] border border-warn/30 bg-warn-soft px-3.5 py-3 text-[15px] text-warn">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 leading-relaxed">
        <p className="font-medium">
          {missing.length === 2
            ? "Live results are off until API credentials are added."
            : `${labels} isn't answering yet.`}
        </p>
        <p className="mt-0.5 opacity-85">
          {missing.length === 2
            ? "TuneShift reads the official Spotify and YouTube APIs. Without keys it shows this notice instead of inventing results."
            : "Check the credentials and that the API is enabled for your project."}
        </p>
        <Link
          href="/setup"
          className="mt-1.5 inline-flex items-center gap-1 font-medium underline decoration-2 underline-offset-4"
        >
          Open setup guide
          <ArrowRight className="size-3" aria-hidden />
        </Link>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="-m-1 rounded p-1 opacity-60 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
