"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType as ValueType,
} from "recharts";
import { formatDate } from "@/lib/format";
import type { HistoryPoint } from "@/lib/history";

// Flat line chart: 2px line, 8px dots, hairline solid gridlines, hover crosshair.
// Single series per view, so no legend; the topic select names it.

const ACCENT = "#C6F432";
const LINE = "#2A2A2D";
const INK_2 = "#9A9A9F";

function ChartTooltip({ active, payload }: TooltipContentProps<ValueType, string | number>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as HistoryPoint;
  return (
    <div className="rounded-[10px] border border-line bg-card-2 px-3 py-2 text-[13px] text-text">
      <p className="tnum text-text-2">{formatDate(p.at)}</p>
      <p>
        <span className="tnum font-medium">{p.score}</span> after {p.activity.toLowerCase()}
      </p>
    </div>
  );
}

export default function ScoreChart({ points, label }: { points: HistoryPoint[]; label: string }) {
  const data = points.map((p, i) => ({ ...p, i }));
  return (
    <figure aria-label={`Understanding score over time for ${label}`} className="flex h-full min-h-0 flex-col">
      <div className="min-h-[200px] w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 24, bottom: 4, left: -12 }}>
            <CartesianGrid vertical={false} stroke={LINE} strokeWidth={1} />
            <XAxis
              dataKey="i"
              type="number"
              domain={[0, Math.max(1, data.length - 1)]}
              ticks={data.map((d) => d.i)}
              tickFormatter={(i: number) => formatDate(data[i]?.at)}
              tick={{ fill: INK_2, fontSize: 12 }}
              axisLine={{ stroke: LINE }}
              tickLine={false}
              padding={{ left: 16, right: 16 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: INK_2, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={ChartTooltip} cursor={{ stroke: INK_2, strokeWidth: 1 }} />
            <Line
              type="linear"
              dataKey="score"
              stroke={ACCENT}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={false}
              dot={{ r: 4, fill: ACCENT, stroke: "#151516", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: ACCENT, stroke: "#151516", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 shrink-0 text-[12px] text-text-2">
        Each point is the score right after a finished activity. Hover a point for details.
      </figcaption>
    </figure>
  );
}
