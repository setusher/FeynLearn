"use client";

import { useRouter } from "next/navigation";
import { Box } from "@/components/ui/Box";
import { Chip } from "@/components/ui/Chip";
import { db } from "@/lib/db";
import { relativeDay } from "@/lib/format";
import { revisitPlan } from "@/lib/revisit";
import { isDue } from "@/lib/sm2";
import type { Topic } from "@/lib/types";
import type { DashData } from "./types";

export function RevisitBox({ data }: { data: DashData }) {
  const router = useRouter();
  const { topics, sessions, now } = data;
  const lastPersona = (t: Topic) =>
    sessions
      .filter((s) => s.topicId === t.id && s.mode === "explain" && s.persona)
      .sort((a, b) => b.startedAt - a.startedAt)[0]?.persona;
  const queue = topics
    .filter((t) => t.nextReview !== undefined)
    .sort((a, b) => a.nextReview! - b.nextReview!)
    .slice(0, 3);
  const next = queue[0] ? revisitPlan(queue[0], lastPersona(queue[0])) : null;

  async function start(t: Topic) {
    const plan = revisitPlan(t, lastPersona(t));
    await db.topics.update(t.id, { lastAngle: plan.angle });
    router.push(plan.href);
  }

  return (
    <Box id="revisit" title="Revisit" href="/revisit" className="area-c" bodyClassName="gap-2">
      {queue.length === 0 ? (
        <p className="text-[13px] text-text-2">Nothing scheduled. Finish a session to start spaced review.</p>
      ) : (
        <>
          {next && <p className="text-[13px] text-text-2">Next: {next.description.replace(/^This time: /, "").replace(/\.$/, "")}</p>}
          <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto">
            {queue.map((t) => {
              const due = isDue(t.nextReview, now);
              return (
                <li key={t.id} className="flex items-center gap-2 rounded-[12px] border border-line bg-card-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold">{t.name}</p>
                    <Chip tone={due ? "lime" : "neutral"} className="mt-1">
                      {due ? "Due today" : relativeDay(t.nextReview, now)}
                    </Chip>
                  </div>
                  <button
                    type="button"
                    onClick={() => start(t)}
                    className="h-8 shrink-0 rounded-[10px] border border-line px-3 text-[12px] font-semibold text-text transition-colors duration-150 hover:border-lime hover:text-lime"
                  >
                    Start
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Box>
  );
}
