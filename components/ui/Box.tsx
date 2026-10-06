import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A bento box: 20px card with a small title row. When `href` is set, an arrow
 * link at the top right opens the full page; the box border lights up on hover
 * or when anything inside has focus. The box itself is not a link, so it can
 * hold inputs and buttons without nesting interactive elements.
 */
export function Box({
  id,
  title,
  href,
  extra,
  className = "",
  bodyClassName = "",
  children,
}: {
  id: string;
  title: ReactNode;
  href?: string;
  extra?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`${id}-title`}
      className={`group flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[20px] border border-line bg-card p-5 transition-colors duration-150 hover:border-text-3 focus-within:border-text-3 ${className}`}
    >
      <header className="mb-3 flex min-h-8 items-center justify-between gap-3">
        <h2 id={`${id}-title`} className="truncate text-[14px] font-semibold text-text">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          {extra}
          {href && (
            <Link
              href={href}
              aria-label={`Open ${typeof title === "string" ? title : "page"}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-line bg-card-2 text-text-2 transition-colors duration-150 hover:border-text-3 hover:text-text"
            >
              <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden />
            </Link>
          )}
        </div>
      </header>
      <div className={`flex min-h-0 flex-1 flex-col ${bodyClassName}`}>{children}</div>
    </section>
  );
}
