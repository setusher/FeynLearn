import type { ReactNode } from "react";

export function PageHeader({
  title,
  intro,
  actions,
}: {
  title: string;
  intro?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px]">{title}</h1>
        {intro && <p className="mt-1 max-w-[640px] text-ink-2">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

/** Plain inline status line used instead of spinners and skeletons. */
export function StatusLine({ children }: { children: ReactNode }) {
  return <p className="text-sm text-ink-2" role="status">{children}</p>;
}

export function ErrorLine({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 border-l-[3px] border-missing bg-tint-missing px-4 py-3 text-sm">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-accent underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
