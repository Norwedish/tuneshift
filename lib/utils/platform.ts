import type { Platform } from "@/types/music";

export function platformLabel(platform: Platform): string {
  return platform === "spotify" ? "Spotify" : "YouTube Music";
}

export function platformShortLabel(platform: Platform): string {
  return platform === "spotify" ? "Spotify" : "YT Music";
}

export function otherPlatform(platform: Platform): Platform {
  return platform === "spotify" ? "youtube" : "spotify";
}

export function trackSubtitle(artists: Array<{ name: string }>): string {
  return artists.map((artist) => artist.name).join(", ");
}
