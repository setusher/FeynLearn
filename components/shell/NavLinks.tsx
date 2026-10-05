"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDueCount } from "@/lib/hooks";

const ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/gap-map", label: "Gap map" },
  { href: "/apply", label: "Apply it" },
  { href: "/understanding", label: "Understanding" },
  { href: "/revisit", label: "Revisit" },
  { href: "/notes", label: "Notes" },
] as const;

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const due = useDueCount();

  return (
    <nav aria-label="Main">
      <ul className="flex flex-col">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between border-l-2 px-5 py-2 text-[15px] no-underline transition-colors duration-150 ${
                  active
                    ? "border-accent bg-bg font-medium text-ink"
                    : "border-transparent text-ink-2 hover:bg-bg hover:text-ink"
                }`}
              >
                <span>{item.label}</span>
                {item.href === "/revisit" && due > 0 && (
                  <span
                    className="tnum rounded-sm border border-line px-1.5 text-xs leading-5 text-ink"
                    aria-label={`${due} due`}
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
