"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/Button";
import { PageHeader, StatusLine } from "@/components/ui/PageHeader";
import { db } from "@/lib/db";
import { formatDate, relativeDay } from "@/lib/format";
import { useAllData, useNow } from "@/lib/hooks";
import { revisitPlan } from "@/lib/revisit";
import { isDue } from "@/lib/sm2";
import type { Topic } from "@/lib/types";

export function Revisit({ highlight }: { highlight?: string }) {
  const data = useAllData();
  const now = useNow();
  const router = useRouter();

  if (!data || now === 0) return <StatusLine>Loading...</StatusLine>;

  const lastPersona = (topic: Topic) =>
    data.sessions
      .filter((s) => s.topicId === topic.id && s.mode === "explain" && s.persona)
      .sort((a, b) => b.startedAt - a.startedAt)[0]?.persona;

  const scheduled = data.topics.filter((t) => t.nextReview !== undefined);
  const due = scheduled.filter((t) => isDue(t.nextReview, now)).sort((a, b) => a.nextReview! - b.nextReview!);
  const upcoming = scheduled.filter((t) => !isDue(t.nextReview, now)).sort((a, b) => a.nextReview! - b.nextReview!);

  async function start(topic: Topic) {
    const plan = revisitPlan(topic, lastPersona(topic));
    await db.topics.update(topic.id, { lastAngle: plan.angle });
    router.push(plan.href);
  }

  return (
    <div className="max-w-[860px]">
      <PageHeader
        title="Revisit"
        intro="Topics come back on a spaced schedule: 1, 3, 7, 14, then 30 days, sooner if a score drops. Each visit uses a different angle so you rebuild the idea instead of repeating it."
      />

      <section aria-labelledby="due-heading">
        <h2 id="due-heading" className="mb-3 text-xl">Due now</h2>
        {due.length === 0 ? (
          <p className="text-ink-2">
            Nothing is due.
            {upcoming[0] ? ` The next one is ${relativeDay(upcoming[0].nextReview, now).toLowerCase()}.` : ""}
          </p>
        ) : (
          <ul className="border-t border-line">
            {due.map((t) => {
              const plan = revisitPlan(t, lastPersona(t));
              return (
                <li
                  key={t.id}
                  className={`flex flex-wrap items-center justify-between gap-4 border-b border-line py-4 ${
                    t.id === highlight ? "border-l-[3px] border-l-accent pl-4" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium">{t.name}</p>
                    <p className="mt-1">{plan.description}</p>
                    <p className="tnum mt-1 text-sm text-ink-2">
                      Due {relativeDay(t.nextReview, now).toLowerCase()}
                      {t.latestScore !== undefined ? ` · last score ${t.latestScore}` : ""}
                    </p>
                  </div>
                  <Button onClick={() => start(t)}>Start revisit</Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="upcoming-heading" className="mt-12">
        <h2 id="upcoming-heading" className="mb-3 text-xl">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-ink-2">No upcoming reviews. Finish an activity on a topic to schedule it.</p>
        ) : (
          <table className="tnum w-full border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-sm text-ink-2">
                <th scope="col" className="py-2 pr-4 font-medium">Topic</th>
                <th scope="col" className="py-2 pr-4 font-medium">Next review</th>
                <th scope="col" className="hidden py-2 pr-4 text-right font-medium sm:table-cell">Interval</th>
                <th scope="col" className="py-2 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((t) => (
                <tr key={t.id} className="border-b border-line">
                  <td className="py-3 pr-4">{t.name}</td>
                  <td className="py-3 pr-4 text-ink-2">
                    {formatDate(t.nextReview)} ({relativeDay(t.nextReview, now).toLowerCase()})
                  </td>
                  <td className="hidden py-3 pr-4 text-right text-ink-2 sm:table-cell">
                    {t.intervalDays} {t.intervalDays === 1 ? "day" : "days"}
                  </td>
                  <td className="py-3 text-right">{t.latestScore ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {scheduled.length === 0 && (
        <Link href="/" className={buttonClass("secondary", "mt-8")}>Start a session</Link>
      )}
    </div>
  );
}
