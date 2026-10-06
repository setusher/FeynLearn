"use client";

import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Chip, SampleChip } from "@/components/ui/Chip";
import { Donut } from "@/components/ui/Donut";
import { PART_KEYS, PART_LABEL, overallDelta, understandingBreakdown, type PartKey } from "@/lib/dashboard";
import type { DashData } from "./types";

// Lime for the primary part, flat grays for the rest. Order alternates light and
// dark so neighbouring segments stay distinct; the legend carries the labels.
const PART_COLOR: Record<PartKey, string> = {
  coverage: "var(--lime)",
  accuracy: "#5C5C61",
  apply: "#E4E4E0",
  reverse: "#9A9A9F",
};

const RANGES = [
  { days: 7, label: "Last 7 days", short: "this week" },
  { days: 30, label: "Last 30 days", short: "this month" },
  { days: 3650, label: "All time", short: "since you started" },
];

export function UnderstandingBox({ data }: { data: DashData }) {
  const [range, setRange] = useState(0);
  const b = understandingBreakdown(data);
  const delta = overallDelta(data, RANGES[range].days, data.now);
  const allSample = data.topics.length > 0 && data.topics.every((t) => t.sample);

  return (
    <Box
      id="understanding"
      title="Understanding score"
      href="/understanding"
      className="area-b"
      extra={
        <>
          {allSample && <SampleChip />}
          <label htmlFor="und-range" className="sr-only">Range</label>
          <select
            id="und-range"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="h-8 rounded-[10px] border border-line bg-card-2 px-2 text-[12px] font-semibold text-text hover:border-text-3"
          >
            {RANGES.map((r, i) => (
              <option key={r.label} value={i}>{r.label}</option>
            ))}
          </select>
        </>
      }
    >
      {b.overall === null ? (
        <p className="text-[13px] text-text-2">Finish and analyze a session to get a score.</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-wrap items-center gap-6">
          <Donut
            label={`Overall understanding ${b.overall} out of 100`}
            segments={PART_KEYS.map((k) => ({ key: k, value: b.segments[k], color: PART_COLOR[k] }))}
            size={164}
            stroke={18}
          >
            <span className="tnum text-[48px] font-bold leading-none">{b.overall}</span>
            <span className="text-[12px] font-semibold text-text-2">out of 100</span>
          </Donut>
          <div className="flex min-w-[170px] flex-1 flex-col gap-2.5">
            <ul className="flex flex-col gap-2">
              {PART_KEYS.map((k) => (
                <li key={k} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="flex items-center gap-2">
                    <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: PART_COLOR[k] }} />
                    <span className="text-text-2">{PART_LABEL[k]}</span>
                  </span>
                  <span className="tnum font-bold">{b.values[k] !== undefined ? `${b.values[k]}%` : "no data"}</span>
                </li>
              ))}
            </ul>
            <div className="mt-1">
              {delta === null || delta === 0 ? (
                <Chip>No change {RANGES[range].short}</Chip>
              ) : (
                <Chip tone={delta > 0 ? "lime" : "outline"}>
                  {delta > 0 ? "+" : ""}
                  {delta} {RANGES[range].short}
                </Chip>
              )}
            </div>
          </div>
        </div>
      )}
    </Box>
  );
}
