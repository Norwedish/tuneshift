import {
  Disc3,
  Heart,
  History,
  House,
  Link2,
  ListMusic,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  description?: string;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Search", icon: House, description: "Find music on both platforms" },
  { href: "/convert", label: "Link converter", shortLabel: "Convert", icon: Link2, description: "Paste a link, get the other platform" },
  { href: "/albums", label: "Albums", icon: Disc3, description: "Move a full album, track order intact" },
  { href: "/playlists", label: "Playlists", icon: ListMusic, description: "Copy a playlist across platforms" },
];

export const LIBRARY_NAV: NavItem[] = [
  { href: "/history", label: "History", icon: History, description: "Everything you've shifted" },
  { href: "/favorites", label: "Favorites", icon: Heart, description: "Saved for later" },
];

export const UTILITY_NAV: NavItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
];
