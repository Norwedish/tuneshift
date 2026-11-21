import type { Metadata } from "next";
import { CollectionEntry } from "@/components/collection/collection-entry";

export const metadata: Metadata = {
  title: "Playlists",
  description: "Move a public playlist from Spotify or YouTube Music to the other platform.",
};

export default function PlaylistsPage() {
  return <CollectionEntry kind="playlist" />;
}
