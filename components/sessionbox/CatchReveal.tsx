"use client";

import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/Button";
import type { ReverseResult, Verdict } from "@/lib/types";

const VERDICT: Record<Verdict, { label: string; color: string }> = {
  caught: { label: "Caught", color: "var(--solid)" },
  partly: { label: "Partly", color: "var(--shaky)" },
  missed: { label: "Missed", color: "var(--missing)" },
};

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  return (
    <span
      className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-bold"
      style={{ borderColor: v.color, color: v.color }}
    >
      <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: v.color }} />
      {v.label}
    </span>
  );
}

const label = "text-[11px] font-bold uppercase tracking-wide text-text-2";

/** Reveal: each planted error with a verdict chip, then false alarms. */
export function CatchReveal({
  result,
  topicId,
  onAgain,
}: {
  result: ReverseResult;
  topicId?: string;
  onAgain: () => void;
}) {
  const verdicts = result.verdicts ?? [];
  const caught = verdicts.filter((v) => v.verdict === "caught").length;
  const reasons = new Map(result.flags.map((f) => [f.index, f.reason]));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-4 rounded-[12px] border border-line bg-card-2 p-3">
        <p className="tnum text-[40px] font-bold leading-none text-lime">{result.score ?? "-"}</p>
        <p className="text-[14px]">
          You caught {caught} of {verdicts.length} planted {verdicts.length === 1 ? "mistake" : "mistakes"}.
          {result.falseAlarms?.length ? ` ${result.falseAlarms.length} false ${result.falseAlarms.length === 1 ? "alarm" : "alarms"}.` : ""}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <h3 className="text-[14px] font-semibold">Planted mistakes</h3>
        <ol className="flex flex-col gap-2">
          {verdicts.map((v) => (
            <li key={v.index} className="rounded-[12px] border border-line bg-card-2 p-3 text-[14px]">
              <div className="flex items-center justify-between gap-2">
                <span className="tnum text-[13px] font-semibold text-text-2">Paragraph {v.index + 1}</span>
                <VerdictChip verdict={v.verdict} />
              </div>
              <p className="mt-1.5 text-text-2">{result.paragraphs[v.index]?.text}</p>
              <p className={`${label} mt-2`}>Correct fact</p>
              <p className="mt-0.5">{v.correctFact}</p>
              {reasons.has(v.index) && (
                <>
                  <p className={`${label} mt-2`}>Your reason</p>
                  <p className="mt-0.5 italic">{reasons.get(v.index) || "No reason given."}</p>
                </>
              )}
              <p className={`${label} mt-2`}>Judgement</p>
              <p className="mt-0.5">{v.judgement}</p>
            </li>
          ))}
        </ol>

        {result.falseAlarms && result.falseAlarms.length > 0 && (
          <>
            <h3 className="mt-2 text-[14px] font-semibold">False alarms</h3>
            <ul className="flex flex-col gap-2">
              {result.falseAlarms.map((f) => (
                <li key={f.index} className="rounded-[12px] border border-line bg-card-2 p-3 text-[14px]">
                  <p className="tnum text-[13px] font-semibold text-text-2">Paragraph {f.index + 1} was correct</p>
                  <p className="mt-1.5 text-text-2">{result.paragraphs[f.index]?.text}</p>
                  <p className={`${label} mt-2`}>Why it is correct</p>
                  <p className="mt-0.5">{f.note}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-line pt-3">
        <Button onClick={onAgain}>Try another</Button>
        {topicId && (
          <Link href={`/gap-map?topic=${encodeURIComponent(topicId)}`} className={buttonClass("secondary")}>
            Open gap map
          </Link>
        )}
      </div>
    </div>
  );
}
