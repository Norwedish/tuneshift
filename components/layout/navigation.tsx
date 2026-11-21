"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Settings } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { useProviderStatus } from "@/components/providers/status-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { StatusDot } from "@/components/ui/badge";
import { LIBRARY_NAV, PRIMARY_NAV, UTILITY_NAV, type NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";
import type { Platform } from "@/types/music";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-9 items-center gap-2.5 rounded-[12px] px-2.5 text-[15px] transition-colors duration-150",
        active
          ? "bg-pine/[0.08] font-semibold text-ink dark:bg-pine/[0.16]"
          : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute -left-3 top-1/2 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-glow [box-shadow:0_0_10px_var(--glow-ring)]"
        />
      ) : null}
      <item.icon
        className={cn("size-4 shrink-0", active ? "text-pine" : "text-faint group-hover:text-muted")}
        aria-hidden
      />
      {item.label}
    </Link>
  );
}

function ProviderRow({ platform }: { platform: Platform }) {
  const { status, loading } = useProviderStatus();
  const state = status?.providers[platform];
  const configured = loading ? undefined : Boolean(state?.configured);
  const ok = Boolean(state?.ok);

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[15px] text-muted">
        <span
          aria-hidden
          className={cn("size-1.5 rounded-full", platform === "spotify" ? "bg-spotify" : "bg-youtube")}
        />
        {platform === "spotify" ? "Spotify" : "YouTube"}
      </span>
      {configured === undefined ? (
        <span className="font-mono text-[15px] uppercase tracking-wider text-faint">…</span>
      ) : (
        <span
          className="flex items-center gap-1 font-mono text-[15px] uppercase tracking-wider text-faint"
          title={state?.message}
        >
          <StatusDot tone={ok ? "ok" : configured ? "danger" : "warn"} />
          {ok ? "live" : configured ? "error" : "not set"}
        </span>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col rail border-r border-line md:flex">
      <div className="px-5 pt-6">
        <Link href="/" className="inline-block" aria-label="TuneShift home">
          <Wordmark />
        </Link>
        <p className="mt-2 pl-[38px] font-mono text-[13px] uppercase tracking-[0.12em] text-faint">
          One library · every platform
        </p>
      </div>

      <nav aria-label="Main" className="mt-8 min-h-0 flex-1 space-y-7 overflow-y-auto px-3 pb-4">
        <div>
          <p className="label mb-2 px-2.5">Discover</p>
          <div className="space-y-0.5">
            <NavLink item={PRIMARY_NAV[0]!} pathname={pathname} />
          </div>
        </div>

        <div>
          <p className="label mb-2 px-2.5">Convert</p>
          <div className="space-y-0.5">
            {PRIMARY_NAV.slice(1).map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>

        <div>
          <p className="label mb-2 px-2.5">Library</p>
          <div className="space-y-0.5">
            {LIBRARY_NAV.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-line px-3 py-4">
        <div className="mb-3 space-y-1.5 rounded-[16px] border border-line bg-surface/60 px-2.5 py-2">
          <ProviderRow platform="spotify" />
          <ProviderRow platform="youtube" />
        </div>

        <Link
          href="/settings"
          className={cn(
            "mb-2 flex h-9 items-center gap-2.5 rounded-[12px] px-2.5 text-[15px] transition-colors",
            isActive(pathname, "/settings")
              ? "bg-pine/[0.07] font-medium text-ink"
              : "text-muted hover:bg-surface-2 hover:text-ink",
          )}
        >
          <Settings className="size-4 text-faint" aria-hidden />
          Settings
        </Link>

        <ThemeToggle />

        <Link
          href="/setup"
          className="mt-3 flex items-center justify-between px-1 text-[14px] text-faint transition-colors hover:text-muted"
        >
          <span className="font-mono uppercase tracking-[0.1em]">v1.0</span>
          <span className="inline-flex items-center gap-1">
            How it works
            <ArrowUpRight className="size-3" aria-hidden />
          </span>
        </Link>
      </div>
    </aside>
  );
}

const MOBILE_ITEMS: NavItem[] = [
  PRIMARY_NAV[0]!,
  { ...PRIMARY_NAV[1]!, label: "Convert" },
  PRIMARY_NAV[2]!,
  PRIMARY_NAV[3]!,
  { ...LIBRARY_NAV[0]!, label: "Library" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 rail border-t border-line md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {MOBILE_ITEMS.map((item) => {
          const active =
            isActive(pathname, item.href) ||
            (item.href === "/history" && isActive(pathname, "/favorites"));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 py-2.5"
            >
              <span
                aria-hidden
                className={cn(
                  "absolute top-0 h-[2px] w-6 rounded-full transition-opacity",
                  active ? "bg-glow opacity-100 [box-shadow:0_0_10px_var(--glow-ring)]" : "opacity-0",
                )}
              />
              <item.icon
                className={cn("size-[21px]", active ? "text-pine" : "text-faint")}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[13px] font-medium tracking-wide",
                  active ? "text-ink" : "text-faint",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between rail border-b border-line px-4 md:hidden">
      <Link href="/" aria-label="TuneShift home">
        <Wordmark size={24} />
      </Link>
      <div className="flex items-center gap-1.5">
        <ThemeToggle compact />
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-9 items-center justify-center rounded-full btn-secondary text-ink-2 transition-colors duration-150 hover:text-ink"
        >
          <Settings className="size-4" aria-hidden />
        </Link>
      </div>
    </header>
  );
}
