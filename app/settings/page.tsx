import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  description: "Tune your themes, motion and match preferences. Stored locally.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
