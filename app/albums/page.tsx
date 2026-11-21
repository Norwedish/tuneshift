import type { Metadata } from "next";
import { CollectionEntry } from "@/components/collection/collection-entry";

export const metadata: Metadata = {
  title: "Albums",
  description:
    "Move a full album from Spotify or YouTube Music to the other platform, track order intact.",
};

export default function AlbumsPage() {
  return <CollectionEntry kind="album" />;
}
