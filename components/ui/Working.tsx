/** Plain loading state: a "Working..." line over a thin static lime bar. No shimmer. */
export function Working({ label = "Working..." }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col gap-2 text-[13px] text-text-2">
      <span>{label}</span>
      <span aria-hidden className="block h-[2px] w-24 bg-lime" />
    </div>
  );
}
