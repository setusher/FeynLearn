import { topicScore } from "./score";
import type { Challenge, Session } from "./types";

export type HistoryPoint = { at: number; score: number; activity: string };

const ACTIVITY: Record<Session["mode"], string> = {
  explain: "Explain session",
  reverse: "Catch the mistake",
};

/**
 * Understanding score over time for one topic: after each finished activity,
 * the score as it stood at that moment (same formula as lib/score.ts).
 */
export function scoreHistory(sessions: Session[], challenges: Challenge[]): HistoryPoint[] {
  const events = [
    ...sessions
      .filter((s) => (s.mode === "explain" ? s.coverage !== undefined : s.reverse?.score !== undefined))
      .map((s) => ({ at: s.endedAt ?? s.startedAt, activity: ACTIVITY[s.mode] })),
    ...challenges.filter((c) => c.rubric).map((c) => ({ at: c.createdAt, activity: "Apply it" })),
  ].sort((a, b) => a.at - b.at);

  return events.flatMap((e) => {
    const score = topicScore(sessions, challenges, e.at);
    return score === null ? [] : [{ ...e, score }];
  });
}
