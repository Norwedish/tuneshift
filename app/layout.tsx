import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono, Syne } from "next/font/google";
import { AppShell } from "@/components/layout/app-shell";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { StatusProvider } from "@/components/providers/status-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TuneShift — One library. Every platform.",
    template: "%s · TuneShift",
  },
  description:
    "Search for music and move songs, albums and playlists between Spotify and YouTube Music. Artwork, duration and version-aware matching. No account needed.",
  applicationName: "TuneShift",
  keywords: [
    "Spotify to YouTube Music",
    "YouTube Music to Spotify",
    "playlist converter",
    "music converter",
    "TuneShift",
  ],
  openGraph: {
    title: "TuneShift — One library. Every platform.",
    description:
      "Move songs, albums and playlists between Spotify and YouTube Music. Version-aware matching, no sign-up.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f8" },
    { media: "(prefers-color-scheme: dark)", color: "#12152a" },
  ],
};

const THEME_SCRIPT = `(function(){try{var raw=localStorage.getItem('tuneshift.settings.v1');var s=raw?JSON.parse(raw):{};var t=s.theme||'system';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(dark)r.classList.add('dark');r.style.colorScheme=dark?'dark':'light';if(s.reduceMotion)r.dataset.reduceMotion='true';}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <PreferencesProvider>
          <ToastProvider>
            <StatusProvider>
              <AppShell>{children}</AppShell>
            </StatusProvider>
          </ToastProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
