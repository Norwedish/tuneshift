import type { Metadata } from "next";
import { FavoritesView } from "@/components/library/favorites-view";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Tracks you saved for later. Stored in your browser only.",
};

export default function FavoritesPage() {
  return <FavoritesView />;
}
