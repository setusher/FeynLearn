"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDueCount } from "@/lib/hooks";

export const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/session", label: "Session" },
  { href: "/gap-map", label: "Gap map" },
  { href: "/apply", label: "Apply it" },
  { href: "/understanding", label: "Understanding" },
  { href: "/revisit", label: "Revisit" },
  { href: "/notes", label: "Notes" },
] as const;

/** Pill tabs. Scrolls horizontally when there is not enough room. */
export function NavTabs() {
  const pathname = usePathname();
  const due = useDueCount();
  return (
    <nav aria-label="Main" className="min-w-0 overflow-x-auto">
      <ul className="flex w-max items-center gap-1.5 py-1">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold no-underline transition-colors duration-150 ${
                  active ? "bg-lime text-on-lime" : "bg-card text-text-2 hover:bg-card-2 hover:text-text"
                }`}
              >
                {tab.label}
                {tab.href === "/revisit" && due > 0 && (
                  <span
                    aria-label={`${due} due`}
                    className={`tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] ${
                      active ? "bg-on-lime text-lime" : "bg-lime text-on-lime"
                    }`}
                  >
                    {due}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
