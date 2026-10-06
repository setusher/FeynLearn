import { describe, expect, it } from "vitest";
import { overallDelta, sessionsPerDay, understandingBreakdown } from "@/lib/dashboard";
import { overallScore } from "@/lib/stats";
import type { Challenge, Session, Topic } from "@/lib/types";

const DAY = 86_400_000;
const topic = (id: string): Topic => ({ id, name: id, createdAt: 0, intervalDays: 0, ease: 2.5 });
const explain = (topicId: string, at: number, coverage: number, accuracy: number): Session => ({
  id: `${topicId}${at}`, topicId, mode: "explain", startedAt: at, endedAt: at, messages: [], coverage, accuracy,
});

describe("understandingBreakdown", () => {
  const challenge: Challenge = {
    id: "c", topicId: "b", scenario: "", createdAt: 5,
    rubric: [{ criterion: "x", score: 2, feedback: "" }, { criterion: "y", score: 1, feedback: "" }],
  };
  const data = {
    topics: [topic("a"), topic("b")],
    sessions: [explain("a", 1, 80, 60), explain("b", 2, 40, 100)],
    challenges: [challenge],
  };

  it("segments add up to the overall score", () => {
    const b = understandingBreakdown(data);
    const sum = Object.values(b.segments).reduce((x, y) => x + y, 0);
    expect(Math.round(sum)).toBe(b.overall);
    expect(b.overall).toBe(overallScore(data.topics, data.sessions, data.challenges));
  });

  it("reports average part values across topics that have them", () => {
    const b = understandingBreakdown(data);
    expect(b.values.coverage).toBe(60);
    expect(b.values.apply).toBe(75);
    expect(b.values.reverse).toBeUndefined();
  });

  it("is empty without data", () => {
    expect(understandingBreakdown({ topics: [], sessions: [], challenges: [] }).overall).toBeNull();
  });
});

describe("overallDelta", () => {
  it("compares now with the start of the range", () => {
    const now = 20 * DAY;
    const data = { topics: [topic("a")], sessions: [explain("a", 5 * DAY, 20, 20), explain("a", 18 * DAY, 80, 80)], challenges: [] };
    expect(overallDelta(data, 7, now)).toBe(60);
  });

  it("is null when nothing existed at the start", () => {
    const now = 20 * DAY;
    const data = { topics: [topic("a")], sessions: [explain("a", 18 * DAY, 80, 80)], challenges: [] };
    expect(overallDelta(data, 7, now)).toBeNull();
  });
});

describe("sessionsPerDay", () => {
  it("returns 7 days, oldest first, counting sessions per day", () => {
    const now = new Date(2026, 9, 6, 12).getTime();
    const s = (t: number): Session => ({ id: String(t), topicId: "a", mode: "explain", startedAt: t, messages: [] });
    const days = sessionsPerDay([s(now), s(now - 1000), s(now - 3 * DAY)], now);
    expect(days).toHaveLength(7);
    expect(days[6].count).toBe(2);
    expect(days[3].count).toBe(1);
  });
});
