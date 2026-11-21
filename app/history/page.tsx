import type { Metadata } from "next";
import { HistoryView } from "@/components/library/history-view";

export const metadata: Metadata = {
  title: "History",
  description: "Conversions you have run in this browser. Stored locally, never uploaded.",
};

export default function HistoryPage() {
  return <HistoryView />;
}
