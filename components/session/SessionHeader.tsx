import type { ReactNode } from "react";

/** Page header row for a session: mode toggle on the left, actions on the right. */
export function SessionHeader({
  topic,
  toggle,
  meta,
  actions,
}: {
  topic: string;
  toggle: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 border-b border-line pb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {toggle}
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <h1 className="mt-5 text-[28px]">{topic}</h1>
      {meta && <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2 text-sm text-ink-2">{meta}</div>}
    </header>
  );
}
