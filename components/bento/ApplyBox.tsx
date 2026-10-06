"use client";

import Link from "next/link";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { SampleChip } from "@/components/ui/Chip";
import { rubricTotal } from "@/lib/challenges";
import type { DashData } from "./types";

const SHORT: Record<string, string> = {
  "Uses the concept correctly": "Concept",
  "Reasoning is sound": "Reasoning",
  "Considers limits or edge cases": "Limits",
};

export function ApplyBox({ data }: { data: DashData }) {
  const latest = [...data.challenges].sort((a, b) => b.createdAt - a.createdAt)[0];
  const topic = data.topics.find((t) => t.id === latest?.topicId);
  const fallbackTopic = [...data.topics].sort((a, b) => b.createdAt - a.createdAt)[0];
  const target = topic ?? fallbackTopic;
  const href = target ? `/apply?topic=${encodeURIComponent(target.id)}` : "/apply";

  return (
    <Box id="apply" title="Apply it" href={href} className="area-f" extra={topic?.sample ? <SampleChip /> : undefined} bodyClassName="gap-3">
      {latest ? (
        <>
          <p className="line-clamp-3 text-[14px] leading-snug">{latest.scenario}</p>
          {latest.rubric ? (
            <div className="flex items-end gap-3">
              <ul className="flex flex-1 gap-2" aria-label="Rubric scores">
                {latest.rubric.map((r) => (
                  <li key={r.criterion} className="flex-1">
                    <p className="text-[11px] font-semibold text-text-2">{SHORT[r.criterion] ?? r.criterion}</p>
                    <div className="mt-1 flex gap-1" role="img" aria-label={`${r.criterion}: ${r.score} of 2`}>
                      {[0, 1].map((i) => (
                        <span key={i} className={`h-2 flex-1 rounded-[3px] ${i < r.score ? "bg-lime" : "bg-card-2"}`} />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <span className="tnum text-[22px] font-bold leading-none">
                {rubricTotal(latest.rubric)}
                <span className="text-[12px] font-semibold text-text-2"> / 6</span>
              </span>
            </div>
          ) : (
            <p className="text-[13px] text-text-2">Waiting for your answer.</p>
          )}
        </>
      ) : (
        <p className="text-[13px] text-text-2">
          Get a realistic scenario and use the idea to solve it. You are graded on concept, reasoning and limits.
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={href} className={buttonClass("primary", "h-9")}>New scenario</Link>
        <Link href={href} className={buttonClass("secondary", "h-9")}>Open</Link>
      </div>
    </Box>
  );
}
