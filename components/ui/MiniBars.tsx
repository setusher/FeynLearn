/** Seven tiny flat bars (one per day). Days with activity are lime, the rest gray. */
export function MiniBars({ days, label }: { days: { day: number; count: number }[]; label: string }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div role="img" aria-label={label} className="flex h-full items-end gap-1">
      {days.map((d) => (
        <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span
            className={`block w-full max-w-[14px] rounded-[3px] ${d.count ? "bg-lime" : "bg-card-2"}`}
            style={{ height: `${d.count ? Math.max(18, (d.count / max) * 100) : 12}%` }}
          />
          <span aria-hidden className="text-[10px] font-semibold text-text-2">
            {new Date(d.day).toLocaleDateString(undefined, { weekday: "narrow" })}
          </span>
        </div>
      ))}
    </div>
  );
}
