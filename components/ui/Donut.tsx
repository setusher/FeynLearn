import type { ReactNode } from "react";

export type DonutSegment = { key: string; value: number; color: string };

/**
 * Flat donut. Segment values are on a 0-100 scale; whatever is left of 100 shows
 * as the --card-2 track. A 2px gap separates segments. No gradients, no animation.
 */
export function Donut({
  segments,
  size = 140,
  stroke = 16,
  label,
  children,
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  label: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 2;
  const visible = segments.filter((s) => s.value > 0.5);
  const lengths = visible.map((s) => (Math.min(100, s.value) / 100) * c);
  const arcs = visible.map((s, i) => ({
    ...s,
    dash: Math.max(0, lengths[i] - gap),
    offset: lengths.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-2)" strokeWidth={stroke} />
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={stroke}
              strokeDasharray={`${a.dash} ${c - a.dash}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
