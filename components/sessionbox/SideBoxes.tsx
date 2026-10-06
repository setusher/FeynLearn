"use client";

import { useEffect, useState } from "react";
import { finishedAt, isAnalyzed, type DashData } from "@/components/bento/types";
import { Box } from "@/components/ui/Box";
import { Chip, StatusMark } from "@/components/ui/Chip";
import { conceptMentioned, topTerms } from "@/lib/mentions";
import type { ActiveSession, Misconception } from "@/lib/types";

/** The session record for the active session, if it exists yet. */
function useActiveRecord(data: DashData, active: ActiveSession | undefined) {
  return active?.sessionId ? data.sessions.find((s) => s.id === active.sessionId) : undefined;
}

function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TimerBox({ data, active }: { data: DashData; active?: ActiveSession }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const record = useActiveRecord(data, active);
  const turns = record?.messages.filter((m) => m.role === "user").length ?? 0;
  const flags = record?.reverse?.flags.length ?? 0;
  const done = Boolean(record?.endedAt);
  const elapsed = active ? (done && record?.endedAt ? record.endedAt : now) - active.startedAt : 0;

  return (
    <Box id="timer" title="Session timer" bodyClassName="justify-between gap-2">
      {active ? (
        <>
          <p className="tnum text-[56px] font-bold leading-none text-lime" aria-label={`Elapsed ${clock(elapsed)}`}>
            {clock(elapsed)}
          </p>
          <p className="text-[13px] text-text-2">
            {done ? "Finished. " : ""}
            {active.mode === "explain" ? `${turns} ${turns === 1 ? "turn" : "turns"} so far` : `${flags} ${flags === 1 ? "paragraph" : "paragraphs"} flagged`}
          </p>
        </>
      ) : (
        <>
          <p className="tnum text-[56px] font-bold leading-none text-text-3">00:00</p>
          <p className="text-[13px] text-text-2">Starts when you begin a session.</p>
        </>
      )}
    </Box>
  );
}

export function ConceptsSoFarBox({ data, active }: { data: DashData; active?: ActiveSession }) {
  const record = useActiveRecord(data, active);
  const topic = active ? data.topics.find((t) => t.name.toLowerCase() === active.topic.toLowerCase()) : undefined;
  const map = topic
    ? [...data.sessions]
        .filter((s) => s.topicId === topic.id && isAnalyzed(s) && s.id !== record?.id)
        .sort((a, b) => finishedAt(b) - finishedAt(a))[0]
    : undefined;
  const said = (record?.messages ?? []).filter((m) => m.role === "user").map((m) => m.text);
  const concepts = map?.concepts ?? [];
  const mentioned = concepts.filter((c) => conceptMentioned(c.label, said)).length;

  return (
    <Box id="concepts" title="Topic concepts so far" bodyClassName="gap-2">
      {!active ? (
        <p className="text-[13px] text-text-2">Begin a session to track which key ideas you have covered.</p>
      ) : concepts.length > 0 ? (
        <>
          <p className="tnum text-[13px] text-text-2">
            {active.mode === "reverse"
              ? "From your last map. Planted mistakes often target the shaky ones."
              : `${mentioned} of ${concepts.length} mentioned, from your last map. The full check runs when you analyze.`}
          </p>
          <ul className="flex min-h-0 flex-col gap-1.5 overflow-y-auto text-[13px]">
            {concepts.map((c) => {
              const hit = active.mode === "explain" && conceptMentioned(c.label, said);
              return (
                <li key={c.id} className="flex items-start justify-between gap-2 rounded-[10px] border border-line bg-card-2 px-2.5 py-1.5">
                  <span className={hit ? "text-text" : "text-text-2"}>{c.label}</span>
                  {hit ? <Chip tone="lime">Mentioned</Chip> : <span className="shrink-0 text-[12px] text-text-2"><StatusMark status={c.status} label={`was ${c.status}`} /></span>}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <>
          <p className="text-[13px] text-text-2">No map for this topic yet. Key terms you have used:</p>
          <div className="flex flex-wrap gap-1.5">
            {topTerms(said).map((t) => (
              <Chip key={t}>{t}</Chip>
            ))}
            {said.length === 0 && <span className="text-[13px] text-text-2">none yet</span>}
          </div>
        </>
      )}
    </Box>
  );
}

export function MisconceptionLogBox({ data, active }: { data: DashData; active?: ActiveSession }) {
  const record = useActiveRecord(data, active);
  let items: Misconception[] = [];
  if (record?.mode === "explain") {
    items = record.messages.flatMap((m) => (m.misconception ? [m.misconception] : []));
  } else if (record?.reverse?.verdicts) {
    items = record.reverse.verdicts
      .filter((v) => v.verdict !== "caught")
      .map((v) => ({ name: v.verdict === "missed" ? `Missed in paragraph ${v.index + 1}` : `Partly caught, paragraph ${v.index + 1}`, correction: v.correctFact }));
  }

  return (
    <Box id="mislog" title="Misconception log" bodyClassName="gap-2">
      {items.length === 0 ? (
        <p className="text-[13px] text-text-2">
          {active?.mode === "reverse"
            ? "Mistakes you miss show up here after the reveal."
            : "None flagged yet. Wrong statements show up here as the learner spots them."}
        </p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto text-[13px]">
          {items.map((m, i) => (
            <li key={i} className="rounded-[10px] border border-line border-l-[3px] border-l-shaky bg-card-2 px-2.5 py-2">
              <p className="font-semibold">{m.name}</p>
              <p className="mt-0.5 text-text-2">{m.correction}</p>
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}

const TIPS = {
  explain: [
    "Explain cause and effect, not just facts: say why each step happens.",
    "Swap jargon for plain words; the learner will ask about any term you do not explain.",
    "Use one concrete example with numbers.",
    "When you are stuck, say what you do not know. That is a gap worth mapping.",
  ],
  reverse: [
    "Read each paragraph and ask whether a cause, a number or a direction is reversed.",
    "Say what the correct fact is, not just that something is wrong.",
    "Flag only what you can justify; false alarms cost points.",
  ],
};

export function TipsBox({ active }: { active?: ActiveSession }) {
  const tips = TIPS[active?.mode ?? "explain"];
  return (
    <Box id="tips" title="Tips" bodyClassName="gap-2">
      <ul className="flex min-h-0 flex-col gap-2 overflow-y-auto text-[13px] text-text-2">
        {tips.map((t, i) => (
          <li key={t} className="flex gap-2">
            <span className="tnum shrink-0 font-bold text-lime">{String(i + 1).padStart(2, "0")}</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Box>
  );
}
