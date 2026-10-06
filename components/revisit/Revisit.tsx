"use client";

import { useRouter } from "next/navigation";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Chip, SampleChip } from "@/components/ui/Chip";
import { Working } from "@/components/ui/Working";
import { db } from "@/lib/db";
import { formatDate, relativeDay } from "@/lib/format";
import { useAllData, useNow } from "@/lib/hooks";
import { ANGLES, revisitPlan } from "@/lib/revisit";
import { GOOD_THRESHOLD, INTERVALS, POOR_THRESHOLD, isDue } from "@/lib/sm2";
import type { RevisitAngle, Topic } from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

const ANGLE_TEXT: Record<RevisitAngle, string> = {
  persona: "Explain it to a different persona",
  analogy: "Explain it through an everyday analogy",
  apply: "Solve an Apply it scenario",
  reverse: "Catch the mistakes in an explanation",
};

function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function Revisit({ highlight }: { highlight?: string }) {
  const data = useAllData();
  const now = useNow();
  const router = useRouter();

  if (!data || now === 0) return <Working />;

  const lastPersona = (topic: Topic) =>
    data.sessions
      .filter((s) => s.topicId === topic.id && s.mode === "explain" && s.persona)
      .sort((a, b) => b.startedAt - a.startedAt)[0]?.persona;

  const scheduled = data.topics.filter((t) => t.nextReview !== undefined);
  const due = scheduled.filter((t) => isDue(t.nextReview, now)).sort((a, b) => a.nextReview! - b.nextReview!);
  const upcoming = scheduled.filter((t) => !isDue(t.nextReview, now)).sort((a, b) => a.nextReview! - b.nextReview!);
  const today = startOfDay(now);
  const days = Array.from({ length: 14 }, (_, i) => {
    const day = today + i * DAY;
    return { day, topics: scheduled.filter((t) => t.nextReview! >= day && t.nextReview! < day + DAY && !isDue(t.nextReview, now)) };
  });
  const sample = scheduled.some((t) => t.sample);

  async function start(topic: Topic) {
    const plan = revisitPlan(topic, lastPersona(topic));
    await db.topics.update(topic.id, { lastAngle: plan.angle });
    router.push(plan.href);
  }

  return (
    <div className="grid gap-4 desk:h-[calc(100vh-121px)] desk:min-h-[640px] desk:grid-cols-12 desk:grid-rows-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <h1 className="sr-only">Revisit</h1>
      <Box
        id="due"
        title={`Due now${due.length ? ` (${due.length})` : ""}`}
        className="min-h-[240px] desk:col-span-7 desk:min-h-0"
        extra={sample ? <SampleChip /> : undefined}
        bodyClassName="gap-2"
      >
        {due.length === 0 ? (
          <p className="text-[13px] text-text-2">
            Nothing is due.{upcoming[0] ? ` The next one is ${relativeDay(upcoming[0].nextReview, now).toLowerCase()}.` : ""}
          </p>
        ) : (
          <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto">
            {due.map((t) => {
              const plan = revisitPlan(t, lastPersona(t));
              return (
                <li
                  key={t.id}
                  className={`flex flex-wrap items-center gap-3 rounded-[12px] border bg-card-2 px-4 py-3 ${
                    t.id === highlight ? "border-lime" : "border-line"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{t.name}</p>
                    <p className="mt-0.5 text-[14px]">{plan.description}</p>
                    <p className="tnum mt-1 flex flex-wrap items-center gap-2 text-[12px] text-text-2">
                      <Chip tone="lime">{relativeDay(t.nextReview, now) === "Today" ? "Due today" : `Due ${relativeDay(t.nextReview, now).toLowerCase()}`}</Chip>
                      {t.latestScore !== undefined && <span>Last score {t.latestScore}</span>}
                    </p>
                  </div>
                  <Button onClick={() => start(t)}>Start revisit</Button>
                </li>
              );
            })}
          </ul>
        )}
      </Box>

      <Box id="schedule" title="How scheduling works" className="desk:col-span-5 desk:row-span-2" bodyClassName="gap-4 overflow-y-auto">
        <div>
          <p className="text-[13px] text-text-2">Intervals grow each time you do well:</p>
          <ol className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Review intervals in days">
            {INTERVALS.map((d, i) => (
              <li key={d} className="flex items-center gap-1.5">
                <span className="tnum inline-flex h-9 min-w-12 items-center justify-center rounded-[10px] border border-line bg-card-2 px-2 text-[14px] font-bold">
                  {d}
                  <span className="ml-0.5 text-[11px] font-semibold text-text-2">d</span>
                </span>
                {i < INTERVALS.length - 1 && <span aria-hidden className="text-text-3">&rarr;</span>}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[12px] text-text-2">After 30 days, the interval keeps growing by your ease factor.</p>
        </div>
        <ul className="flex flex-col gap-2 text-[13px]">
          <li className="rounded-[12px] border border-line bg-card-2 px-3 py-2">
            <span className="font-semibold text-lime">{GOOD_THRESHOLD}+</span> moves you to the next interval.
          </li>
          <li className="rounded-[12px] border border-line bg-card-2 px-3 py-2">
            <span className="font-semibold text-shaky">{POOR_THRESHOLD}-{GOOD_THRESHOLD - 1}</span> repeats the same interval.
          </li>
          <li className="rounded-[12px] border border-line bg-card-2 px-3 py-2">
            <span className="font-semibold text-missing">Below {POOR_THRESHOLD}</span> resets to 1 day.
          </li>
        </ul>
        <div>
          <p className="text-[13px] text-text-2">Each revisit comes from a different angle, in this order:</p>
          <ol className="mt-2 flex flex-col gap-1.5">
            {ANGLES.map((a, i) => (
              <li key={a} className="flex gap-3 text-[13px]">
                <span className="tnum font-bold text-lime">{String(i + 1).padStart(2, "0")}</span>
                <span>{ANGLE_TEXT[a]}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[12px] text-text-2">Your score from the revisit sets the next date.</p>
        </div>
      </Box>

      <Box id="upcoming" title="Upcoming" className="min-h-[300px] desk:col-span-7 desk:min-h-0" bodyClassName="gap-3">
        <ol className="grid shrink-0 grid-cols-7 gap-1.5" aria-label="Next 14 days">
          {days.map(({ day, topics }) => {
            const d = new Date(day);
            return (
              <li
                key={day}
                className={`flex min-h-[58px] flex-col rounded-[10px] border px-2 py-1.5 ${
                  topics.length ? "border-lime bg-card-2" : "border-line"
                }`}
                aria-label={`${d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}: ${topics.length ? topics.map((t) => t.name).join(", ") : "nothing scheduled"}`}
              >
                <span className="text-[10px] font-semibold uppercase text-text-2">{d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span className="tnum text-[16px] font-bold leading-tight">{d.getDate()}</span>
                {topics.length > 0 && (
                  <span className="tnum mt-auto text-[10px] font-bold text-lime">{topics.length} review{topics.length > 1 ? "s" : ""}</span>
                )}
              </li>
            );
          })}
        </ol>
        {upcoming.length === 0 ? (
          <p className="text-[13px] text-text-2">No upcoming reviews. Finish an activity on a topic to schedule it.</p>
        ) : (
          <ul className="flex min-h-0 flex-col overflow-y-auto">
            {upcoming.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 border-b border-line py-2 text-[13px] last:border-b-0">
                <span className="min-w-0 truncate font-semibold">{t.name}</span>
                <span className="tnum flex shrink-0 items-center gap-3 text-text-2">
                  <span>{t.intervalDays} {t.intervalDays === 1 ? "day" : "days"}</span>
                  <span>score {t.latestScore ?? "-"}</span>
                  <Chip>{formatDate(t.nextReview)}, {relativeDay(t.nextReview, now).toLowerCase()}</Chip>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Box>
    </div>
  );
}
