"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Field";
import { PageHeader, StatusLine } from "@/components/ui/PageHeader";
import { scoreHistory } from "@/lib/history";
import { useAllData } from "@/lib/hooks";
import { WEIGHTS, topicScore } from "@/lib/score";
import { overallScore } from "@/lib/stats";

const ScoreChart = dynamic(() => import("./ScoreChart"), {
  ssr: false,
  loading: () => <StatusLine>Loading chart...</StatusLine>,
});

const pct = (w: number) => `${Math.round(w * 100)}%`;

function HowCalculated() {
  return (
    <details className="mt-4 max-w-[640px] border-t border-line pt-3 text-sm">
      <summary className="cursor-pointer text-accent underline underline-offset-2">How is this calculated?</summary>
      <div className="mt-3 flex flex-col gap-2 text-ink-2">
        <p>Each topic gets a score from 0 to 100, made of four parts:</p>
        <ul className="list-disc pl-5">
          <li>{pct(WEIGHTS.coverage)} concept coverage: how many key ideas your latest explanation covered (shaky counts half).</li>
          <li>{pct(WEIGHTS.accuracy)} accuracy: how correct your statements were, with misconceptions lowering it.</li>
          <li>{pct(WEIGHTS.apply)} Apply it: your average rubric score on graded challenges.</li>
          <li>{pct(WEIGHTS.reverse)} Catch the mistake: your latest round.</li>
        </ul>
        <p>
          If you have not done one of these yet for a topic, its weight is shared out among the parts
          you have done. Overall understanding is the average across your topics.
        </p>
      </div>
    </details>
  );
}

export function Understanding() {
  const data = useAllData();
  const [choice, setChoice] = useState<string | null>(null);

  if (!data) return <StatusLine>Loading...</StatusLine>;
  const { topics, sessions, challenges } = data;

  const rows = topics
    .map((t) => {
      const ts = sessions.filter((s) => s.topicId === t.id);
      const tc = challenges.filter((c) => c.topicId === t.id);
      const history = scoreHistory(ts, tc);
      return {
        topic: t,
        history,
        sessions: ts.filter((s) => s.endedAt).length,
        misconceptions: ts.reduce(
          // Analyzed sessions list misconceptions; otherwise count the ones flagged in chat.
          (n, s) => n + (s.misconceptions?.length ?? s.messages.filter((m) => m.misconception).length),
          0,
        ),
        best: history.length ? Math.max(...history.map((h) => h.score)) : null,
        latest: topicScore(ts, tc),
        lastAt: history.at(-1)?.at ?? 0,
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt);

  const overall = overallScore(topics, sessions, challenges);
  const charted = rows.filter((r) => r.history.length > 0);
  const selected = charted.find((r) => r.topic.id === choice) ?? charted[0];

  if (rows.length === 0) {
    return (
      <div className="max-w-[960px]">
        <PageHeader title="Understanding" />
        <p className="text-ink-2">No scores yet. Finish and analyze a session to see your understanding here.</p>
        <Link href="/" className={buttonClass("secondary", "mt-4")}>Start a session</Link>
      </div>
    );
  }

  return (
    <div className="max-w-[960px]">
      <PageHeader title="Understanding" />

      <section aria-labelledby="overall-label">
        <p id="overall-label" className="text-sm text-ink-2">Overall understanding</p>
        <p className="tnum font-serif text-[56px] leading-none">
          {overall ?? "-"}
          <span className="ml-2 font-sans text-base text-ink-2">out of 100</span>
        </p>
        <p className="mt-2 text-sm text-ink-2">
          Average across {charted.length} {charted.length === 1 ? "topic" : "topics"} with a score.
        </p>
        <HowCalculated />
      </section>

      <section aria-labelledby="trend-heading" className="mt-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <h2 id="trend-heading" className="text-xl">Score over time</h2>
          {charted.length > 0 && (
            <div className="min-w-[260px]">
              <Label htmlFor="chart-topic">Topic</Label>
              <Select id="chart-topic" value={selected?.topic.id} onChange={(e) => setChoice(e.target.value)}>
                {charted.map((r) => (
                  <option key={r.topic.id} value={r.topic.id}>{r.topic.name}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
        {!selected ? (
          <p className="text-ink-2">No finished activities yet.</p>
        ) : selected.history.length < 2 ? (
          <p className="text-ink-2">
            One result so far ({selected.history[0].score}). Do another activity on this topic to see a trend.
          </p>
        ) : (
          <div className="border border-line bg-surface p-4">
            <ScoreChart points={selected.history} label={selected.topic.name} />
          </div>
        )}
      </section>

      <section aria-labelledby="table-heading" className="mt-12">
        <h2 id="table-heading" className="mb-3 text-xl">By topic</h2>
        <div className="overflow-x-auto">
          <table className="tnum w-full min-w-[560px] border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-sm text-ink-2">
                <th scope="col" className="py-2 pr-4 font-medium">Topic</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Sessions</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Misconceptions found</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Best score</th>
                <th scope="col" className="py-2 text-right font-medium">Latest score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.topic.id} className="border-b border-line">
                  <td className="py-3 pr-4">
                    <Link href={`/gap-map?topic=${encodeURIComponent(r.topic.id)}`} className="text-ink no-underline hover:underline">
                      {r.topic.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-right">{r.sessions}</td>
                  <td className="py-3 pr-4 text-right">{r.misconceptions}</td>
                  <td className="py-3 pr-4 text-right">{r.best ?? "-"}</td>
                  <td className="py-3 text-right">{r.latest ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
