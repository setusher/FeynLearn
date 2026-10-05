type Stat = { label: string; value: string; hint?: string };

/** Three plain figures separated by vertical rules. */
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <dl className="grid grid-cols-1 border-y border-line sm:grid-cols-3">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`py-4 sm:px-6 ${i === 0 ? "sm:pl-0" : "border-t border-line sm:border-l sm:border-t-0"}`}
        >
          <dt className="text-sm text-ink-2">{s.label}</dt>
          <dd className="tnum mt-1 font-serif text-[34px] leading-none text-ink">{s.value}</dd>
          {s.hint && <dd className="mt-1 text-xs text-ink-2">{s.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
