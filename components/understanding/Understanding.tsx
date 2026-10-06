"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { isAnalyzed } from "@/components/bento/types";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Chip, SampleChip } from "@/components/ui/Chip";
import { Working } from "@/components/ui/Working";
import { PART_KEYS, PART_LABEL, overallDelta, sessionsPerDay, understandingBreakdown, type PartKey } from "@/lib/dashboard";
import { scoreHistory } from "@/lib/history";
import { useAllData, useNow } from "@/lib/hooks";
import { WEIGHTS, topicScore } from "@/lib/score";

const ScoreChart = dynamic(() => import("./ScoreChart"), {
  ssr: false,
  loading: () => <Working label="Drawing chart..." />,
});

// Same colors as the dashboard donut: lime for coverage, flat grays for the rest.
const PART_COLOR: Record<PartKey, string> = {
  coverage: "var(--lime)",
  accuracy: "#5C5C61",
  apply: "#E4E4E0",
  reverse: "#9A9A9F",
};

const PART_TEXT: Record<PartKey, string> = {
  coverage: "Key ideas your latest explanation covered. Shaky counts half.",
  accuracy: "How correct your statements were. Each misconception lowers it.",
  apply: "Average rubric score on graded Apply it challenges.",
  reverse: "Your latest Catch the mistake round, minus false alarms.",
};

function Stat({ id, title, value, note, lime }: { id: string; title: string; value: string; note: ReactNode; lime?: boolean }) {
  return (
    <Box id={id} title={title} className="desk:col-span-3" bodyClassName="justify-between gap-2">
      <p className={`tnum text-[48px] font-bold leading-none ${lime ? "text-lime" : ""}`}>{value}</p>
      <div className="text-[13px] text-text-2">{note}</div>
    </Box>
  );
}

export function Understanding() {
  const data = useAllData();
  const now = useNow();
  const [choice, setChoice] = useState<string | null>(null);

  if (!data || now === 0) return <Working />;
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
        // Analyzed sessions list misconceptions; otherwise count the ones flagged in chat.
        misconceptions: ts.reduce((n, s) => n + (s.misconceptions?.length ?? s.messages.filter((m) => m.misconception).length), 0),
        best: history.length ? Math.max(...history.map((h) => h.score)) : null,
        latest: topicScore(ts, tc),
        lastAt: history.at(-1)?.at ?? 0,
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt);

  const b = understandingBreakdown(data);
  const delta = overallDelta(data, 7, now);
  const charted = rows.filter((r) => r.history.length > 0);
  const selected = charted.find((r) => r.topic.id === choice) ?? charted[0];
  const finished = sessions.filter((s) => s.endedAt).length;
  const week = sessionsPerDay(sessions, now).reduce((a, x) => a + x.count, 0);
  const mapped = new Set(sessions.filter(isAnalyzed).map((s) => s.topicId)).size;
  const misconceptions = rows.reduce((a, r) => a + r.misconceptions, 0);
  const allSample = topics.length > 0 && topics.every((t) => t.sample);

  if (rows.length === 0) {
    return (
      <Box id="und-empty" title="Understanding" bodyClassName="gap-3">
        <h1 className="sr-only">Understanding</h1>
        <p className="text-[15px] text-text-2">No scores yet. Finish and analyze a session to see your understanding here.</p>
        <Link href="/session" className={buttonClass("primary", "self-start")}>Start a session</Link>
      </Box>
    );
  }

  return (
    <div className="grid gap-4 desk:h-[calc(100vh-121px)] desk:min-h-[720px] desk:grid-cols-12 desk:grid-rows-[auto_minmax(0,1.3fr)_minmax(0,1fr)]">
      <h1 className="sr-only">Understanding</h1>
      <Stat
        id="st-overall"
        title="Overall understanding"
        value={b.overall === null ? "-" : String(b.overall)}
        lime
        note={
          delta === null || delta === 0 ? (
            <Chip>No change this week</Chip>
          ) : (
            <Chip tone={delta > 0 ? "lime" : "outline"}>{delta > 0 ? `+${delta}` : delta} this week</Chip>
          )
        }
      />
      <Stat id="st-topics" title="Topics" value={String(topics.length)} note={`${mapped} with a gap map`} />
      <Stat id="st-sessions" title="Sessions" value={String(finished)} note={`${week} this week`} />
      <Stat id="st-mis" title="Misconceptions found" value={String(misconceptions)} note="Across all your sessions" />

      <Box
        id="trend"
        title="Score over time"
        className="min-h-[360px] desk:col-span-8 desk:min-h-0"
        extra={
          <>
            {allSample && <SampleChip />}
            <div role="radiogroup" aria-label="Topic" className="flex flex-wrap gap-1.5">
              {charted.map((r) => {
                const on = r.topic.id === selected?.topic.id;
                return (
                  <button
                    key={r.topic.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setChoice(r.topic.id)}
                    className={`h-7 max-w-[220px] truncate rounded-full border px-3 text-[12px] font-semibold transition-colors duration-150 ${
                      on ? "border-lime bg-lime text-on-lime" : "border-line bg-card-2 text-text-2 hover:text-text"
                    }`}
                  >
                    {r.topic.name}
                  </button>
                );
              })}
            </div>
          </>
        }
      >
        {!selected ? (
          <p className="text-[13px] text-text-2">No finished activities yet.</p>
        ) : selected.history.length < 2 ? (
          <p className="text-[13px] text-text-2">
            One result so far ({selected.history[0].score}). Do another activity on this topic to see a trend.
          </p>
        ) : (
          <ScoreChart points={selected.history} label={selected.topic.name} />
        )}
      </Box>

      <Box id="formula" title="How is this calculated?" className="desk:col-span-4 desk:row-span-2" bodyClassName="gap-3 overflow-y-auto">
        <p className="text-[13px] text-text-2">Each topic gets a score from 0 to 100, made of four weighted parts:</p>
        <div className="flex h-3 gap-[2px] overflow-hidden rounded-[3px]" role="img" aria-label="Weights: coverage 40%, accuracy 25%, application 20%, spot-the-error 15%">
          {PART_KEYS.map((k) => (
            <span key={k} style={{ width: `${WEIGHTS[k] * 100}%`, background: PART_COLOR[k] }} />
          ))}
        </div>
        <ul className="flex flex-col gap-2.5">
          {PART_KEYS.map((k) => (
            <li key={k} className="flex gap-3 text-[13px]">
              <span className="tnum w-10 shrink-0 text-[15px] font-bold text-lime">{Math.round(WEIGHTS[k] * 100)}%</span>
              <span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: PART_COLOR[k] }} />
                  {PART_LABEL[k]}
                  <span className="tnum font-normal text-text-2">
                    {b.values[k] !== undefined ? `now ${b.values[k]}%` : "no data yet"}
                  </span>
                </span>
                <span className="text-text-2">{PART_TEXT[k]}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="rounded-[12px] border border-line bg-card-2 p-3 text-[13px] text-text-2">
          If a topic has no data for a part yet, that part&apos;s weight is shared out among the parts it does have.
          Overall understanding is the average across your topics.
        </p>
      </Box>

      <Box id="by-topic" title="By topic" className="min-h-[220px] desk:col-span-8 desk:min-h-0" bodyClassName="overflow-auto">
        <table className="tnum w-full min-w-[520px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="border-b border-line text-[12px] text-text-2">
              <th scope="col" className="py-2 pr-4 font-semibold">Topic</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Sessions</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Misconceptions</th>
              <th scope="col" className="py-2 pr-4 text-right font-semibold">Best</th>
              <th scope="col" className="py-2 text-right font-semibold">Latest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.topic.id} className="border-b border-line last:border-b-0">
                <td className="py-2.5 pr-4">
                  <Link href={`/gap-map?topic=${encodeURIComponent(r.topic.id)}`} className="font-semibold text-text no-underline hover:text-lime">
                    {r.topic.name}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-right">{r.sessions}</td>
                <td className="py-2.5 pr-4 text-right">{r.misconceptions}</td>
                <td className="py-2.5 pr-4 text-right">{r.best ?? "-"}</td>
                <td className="py-2.5 text-right font-bold text-lime">{r.latest ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </div>
  );
}
