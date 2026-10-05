import type { ReverseParagraph, Verdict } from "./types";

// Scoring for "Catch the mistake".
//   caught = 1 point, partly = 0.5, missed = 0, averaged over planted errors,
//   then 10 points off per false alarm. Clamped to 0-100.

export const FALSE_ALARM_PENALTY = 10;

export function reverseScore(verdicts: { verdict: Verdict }[], falseAlarms: number): number {
  if (verdicts.length === 0) return 0;
  const points = verdicts.reduce((acc, v) => acc + (v.verdict === "caught" ? 1 : v.verdict === "partly" ? 0.5 : 0), 0);
  const raw = (points / verdicts.length) * 100 - FALSE_ALARM_PENALTY * falseAlarms;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function errorIndexes(paragraphs: Pick<ReverseParagraph, "hasError">[]): number[] {
  return paragraphs.flatMap((p, i) => (p.hasError ? [i] : []));
}
