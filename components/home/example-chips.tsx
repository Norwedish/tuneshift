"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

const EXAMPLES = ["Blinding Lights", "The Weeknd", "Blinding Lights The Weeknd"];

export function ExampleChips() {
  const router = useRouter();

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="font-mono text-[14px] uppercase tracking-[0.12em] text-faint">Try</span>
      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => router.push(`/search?q=${encodeURIComponent(example)}`)}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[15px] text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          <Sparkles className="size-2.5 text-pine" aria-hidden />
          {example}
        </button>
      ))}
    </div>
  );
}
