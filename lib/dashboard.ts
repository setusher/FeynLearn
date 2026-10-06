import { WEIGHTS, topicScore, topicScoreParts, type ScoreParts } from "./score";
import type { Challenge, Session, Topic } from "./types";

const DAY = 24 * 60 * 60 * 1000;
export const PART_KEYS = ["coverage", "accuracy", "apply", "reverse"] as const;
export type PartKey = (typeof PART_KEYS)[number];

export const PART_LABEL: Record<PartKey, string> = {
  coverage: "Coverage",
  accuracy: "Accuracy",
  apply: "Application",
  reverse: "Spot-the-error",
};

type Data = { topics: Topic[]; sessions: Session[]; challenges: Challenge[] };

function byTopic(data: Data, topicId: string) {
  return {
    sessions: data.sessions.filter((s) => s.topicId === topicId),
    challenges: data.challenges.filter((c) => c.topicId === topicId),
  };
}

/** Each part's share of one topic's score after weights are redistributed (sums to the score). */
function contributions(parts: ScoreParts): Partial<Record<PartKey, number>> | null {
  const present = PART_KEYS.filter((k) => parts[k] !== undefined);
  if (present.length === 0) return null;
  const total = present.reduce((a, k) => a + WEIGHTS[k], 0);
  return Object.fromEntries(present.map((k) => [k, (WEIGHTS[k] / total) * Math.max(0, Math.min(100, parts[k]!))]));
}

export type Breakdown = {
  overall: number | null;
  /** Average contribution of each part to the overall score; these sum to `overall`. */
  segments: Record<PartKey, number>;
  /** Average value (0-100) of each part across topics that have it. */
  values: Partial<Record<PartKey, number>>;
  topicsScored: number;
};

/** Breakdown of overall understanding (the average of topic scores) into its four parts. */
export function understandingBreakdown(data: Data, asOf?: number): Breakdown {
  const per = data.topics
    .map((t) => {
      const d = byTopic(data, t.id);
      return topicScoreParts(d.sessions, d.challenges, asOf);
    })
    .map((parts) => ({ parts, contrib: contributions(parts) }))
    .filter((p) => p.contrib !== null);

  const segments = { coverage: 0, accuracy: 0, apply: 0, reverse: 0 };
  const values: Partial<Record<PartKey, number>> = {};
  if (per.length === 0) return { overall: null, segments, values, topicsScored: 0 };

  for (const k of PART_KEYS) {
    segments[k] = per.reduce((a, p) => a + (p.contrib![k] ?? 0), 0) / per.length;
    const withPart = per.filter((p) => p.parts[k] !== undefined);
    if (withPart.length) values[k] = Math.round(withPart.reduce((a, p) => a + p.parts[k]!, 0) / withPart.length);
  }
  const overall = Math.round(PART_KEYS.reduce((a, k) => a + segments[k], 0));
  return { overall, segments, values, topicsScored: per.length };
}

/** Overall understanding at a past moment (average of topic scores then), or null. */
export function overallAt(data: Data, asOf: number): number | null {
  const scores = data.topics
    .map((t) => {
      const d = byTopic(data, t.id);
      return topicScore(d.sessions, d.challenges, asOf);
    })
    .filter((s): s is number => s !== null);
  return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
}

/** Change in overall understanding over the last `days` days, or null if there is nothing to compare. */
export function overallDelta(data: Data, days: number, now: number = Date.now()): number | null {
  const then = overallAt(data, now - days * DAY);
  const current = overallAt(data, now);
  if (then === null || current === null) return null;
  return current - then;
}

/** Sessions started on each of the last 7 calendar days, oldest first. */
export function sessionsPerDay(sessions: Session[], now: number = Date.now()): { day: number; count: number }[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const day = start.getTime() - (6 - i) * DAY;
    return { day, count: sessions.filter((s) => s.startedAt >= day && s.startedAt < day + DAY).length };
  });
}
