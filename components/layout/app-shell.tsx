import { MobileNav, MobileTopBar, Sidebar } from "./navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grain relative min-h-dvh overflow-x-hidden bg-paper">
      <a
        href="#main"
        className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-full btn-primary px-3 py-2 text-[15px] font-semibold transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="relative md:pl-[248px]">
        <MobileTopBar />
        <main id="main" className="relative z-10 pb-28 md:pb-20">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
