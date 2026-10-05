import { topicScore } from "./score";
import type { Challenge, Session, Topic } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function sessionsThisWeek(sessions: Session[], now = Date.now()): number {
  return sessions.filter((s) => now - s.startedAt < 7 * DAY_MS).length;
}

/** Consecutive calendar days, ending today or yesterday, with at least one session. */
export function streakDays(sessions: Session[], now = Date.now()): number {
  const days = new Set(sessions.map((s) => dayKey(s.startedAt)));
  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor -= DAY_MS;
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

export function overallScore(
  topics: Topic[],
  sessions: Session[],
  challenges: Challenge[],
): number | null {
  const scores = topics
    .map((t) =>
      topicScore(
        sessions.filter((s) => s.topicId === t.id),
        challenges.filter((c) => c.topicId === t.id),
      ),
    )
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
