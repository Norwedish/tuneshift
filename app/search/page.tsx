import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView, SearchViewFallback } from "@/components/search/search-view";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search Spotify and YouTube Music at the same time, then convert any result to the other platform.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchViewFallback />}>
      <SearchView />
    </Suspense>
  );
}
