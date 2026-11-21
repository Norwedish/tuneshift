import type { Metadata } from "next";
import { SetupView } from "@/components/setup/setup-view";

export const metadata: Metadata = {
  title: "Setup",
  description:
    "Provider configuration and API key setup for Spotify and YouTube Music search and matching.",
};

export default function SetupPage() {
  return <SetupView />;
}
