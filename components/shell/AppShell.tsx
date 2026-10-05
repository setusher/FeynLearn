"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { useUI } from "@/lib/store";
import { NavLinks } from "./NavLinks";
import { TopBar } from "./TopBar";

function Brand() {
  return (
    <Link href="/" className="font-serif text-xl font-medium text-ink no-underline">
      FeynLearn
    </Link>
  );
}

function SettingsLink({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <Link
      href="/settings"
      onClick={onNavigate}
      aria-current={pathname === "/settings" ? "page" : undefined}
      className="block px-5 py-3 text-sm text-ink-2 no-underline hover:text-ink"
    >
      Settings
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navOpen = useUI((s) => s.navOpen);
  const setNavOpen = useUI((s) => s.setNavOpen);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen, setNavOpen]);

  const close = () => setNavOpen(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_minmax(0,1fr)]">
      {/* Desktop sidebar: a plain column in the page grid. */}
      <aside className="hidden border-r border-line bg-surface md:flex md:min-h-screen md:flex-col">
        <div className="border-b border-line px-5 py-4">
          <Brand />
        </div>
        <div className="flex-1 py-3">
          <NavLinks />
        </div>
        <div className="border-t border-line">
          <SettingsLink />
        </div>
      </aside>

      {/* Mobile top bar. */}
      <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setNavOpen(!navOpen)}
          aria-expanded={navOpen}
          aria-controls="mobile-nav"
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-line px-3 text-sm"
        >
          {navOpen ? <X size={16} strokeWidth={1.5} /> : <Menu size={16} strokeWidth={1.5} />}
          Menu
        </button>
      </div>

      {/* Mobile drawer: plain, full height, opaque. */}
      {navOpen && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-[61px] z-40 flex flex-col bg-surface md:hidden">
          <div className="flex-1 py-3">
            <NavLinks onNavigate={close} />
          </div>
          <div className="border-t border-line">
            <SettingsLink onNavigate={close} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
