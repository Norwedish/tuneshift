import type { Metadata } from "next";
import { Suspense } from "react";
import { ConvertView } from "@/components/converter/convert-view";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Convert",
  description:
    "Paste a Spotify or YouTube Music link and move that one song to the other platform.",
};

export default function ConvertPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page pt-8 lg:pt-12">
          <div className="card p-5 sm:p-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="mt-4 h-12 w-full" />
            <Skeleton className="mt-3 h-12 w-full" />
            <Skeleton className="mt-6 h-40 w-full" />
          </div>
        </div>
      }
    >
      <ConvertView />
    </Suspense>
  );
}
