"use client";

import { Box } from "@/components/ui/Box";
import { MiniBars } from "@/components/ui/MiniBars";
import { sessionsPerDay } from "@/lib/dashboard";
import { isDue } from "@/lib/sm2";
import { isAnalyzed, type DashData } from "./types";

export function StatsBox({ data }: { data: DashData }) {
  const days = sessionsPerDay(data.sessions, data.now);
  const week = days.reduce((a, d) => a + d.count, 0);
  const mapped = new Set(data.sessions.filter(isAnalyzed).map((s) => s.topicId)).size;
  const due = data.topics.filter((t) => isDue(t.nextReview, data.now)).length;

  return (
    <Box id="stats" title="This week" className="area-d" bodyClassName="gap-2">
      <div className="flex min-h-0 flex-1 flex-col rounded-[12px] border border-line bg-card-2 p-3">
        <p className="text-[12px] font-semibold text-text-2">Sessions</p>
        <div className="flex min-h-0 flex-1 items-end gap-3">
          <span className="tnum text-[40px] font-bold leading-none">{week}</span>
          <div className="h-full min-h-[44px] flex-1">
            <MiniBars days={days} label={`Sessions per day, last 7 days: ${days.map((d) => d.count).join(", ")}`} />
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-between rounded-[12px] border border-line bg-card-2 p-3">
        <p className="text-[12px] font-semibold text-text-2">Topics studied</p>
        <p className="tnum text-[40px] font-bold leading-none">{data.topics.length}</p>
        <p className="text-[12px] text-text-2">
          {mapped} mapped, {due} due
        </p>
      </div>
    </Box>
  );
}
