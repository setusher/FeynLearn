import type { Challenge, Session } from "./types";

// Understanding score (0-100) for a topic.
//
//   40%  concept coverage   (latest explain-session analysis)
//   25%  accuracy           (latest analysis; misconceptions are penalized)
//   20%  apply-it rubric    (average of graded challenges, each out of 6)
//   15%  catch-the-mistake  (latest reverse session)
//
// When a component has no data yet, its weight is redistributed proportionally
// across the components that do have data. With no data at all the score is null.

export const WEIGHTS = { coverage: 0.4, accuracy: 0.25, apply: 0.2, reverse: 0.15 } as const;

export type ScoreParts = {
  coverage?: number;
  accuracy?: number;
  apply?: number;
  reverse?: number;
};

export function combineScore(parts: ScoreParts): number | null {
  let total = 0;
  let weight = 0;
  for (const key of Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]) {
    const value = parts[key];
    if (value === undefined || Number.isNaN(value)) continue;
    total += clamp(value) * WEIGHTS[key];
    weight += WEIGHTS[key];
  }
  if (weight === 0) return null;
  return Math.round(total / weight);
}

export function rubricPercent(challenge: Challenge): number | undefined {
  if (!challenge.rubric || challenge.rubric.length === 0) return undefined;
  const sum = challenge.rubric.reduce((acc, r) => acc + r.score, 0);
  return (sum / (challenge.rubric.length * 2)) * 100;
}

/** Score parts for a topic using only records at or before `asOf`. */
export function topicScoreParts(
  sessions: Session[],
  challenges: Challenge[],
  asOf: number = Number.POSITIVE_INFINITY,
): ScoreParts {
  const byTime = (s: Session) => s.endedAt ?? s.startedAt;
  const done = sessions.filter((s) => byTime(s) <= asOf).sort((a, b) => byTime(b) - byTime(a));
  const explain = done.find((s) => s.mode === "explain" && s.coverage !== undefined);
  const reverse = done.find((s) => s.mode === "reverse" && s.reverse?.score !== undefined);
  const graded = challenges
    .filter((c) => c.createdAt <= asOf)
    .map(rubricPercent)
    .filter((v): v is number => v !== undefined);

  return {
    coverage: explain?.coverage,
    accuracy: explain?.accuracy,
    apply: graded.length ? graded.reduce((a, b) => a + b, 0) / graded.length : undefined,
    reverse: reverse?.reverse?.score,
  };
}

export function topicScore(
  sessions: Session[],
  challenges: Challenge[],
  asOf?: number,
): number | null {
  return combineScore(topicScoreParts(sessions, challenges, asOf));
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}
