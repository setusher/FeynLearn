import { describe, expect, it } from "vitest";
import { combineScore, rubricPercent, topicScore } from "@/lib/score";
import type { Challenge, Session } from "@/lib/types";

describe("combineScore", () => {
  it("uses the documented weights when all parts exist", () => {
    // 0.4*100 + 0.25*80 + 0.2*50 + 0.15*0 = 70
    expect(combineScore({ coverage: 100, accuracy: 80, apply: 50, reverse: 0 })).toBe(70);
  });

  it("redistributes weight when parts are missing", () => {
    // Only coverage (0.4) and accuracy (0.25) have data, so they are rescaled over 0.65.
    expect(combineScore({ coverage: 100, accuracy: 50 })).toBe(Math.round((40 + 12.5) / 0.65));
  });

  it("returns the single part when only one exists", () => {
    expect(combineScore({ reverse: 62 })).toBe(62);
  });

  it("returns null with no data", () => {
    expect(combineScore({})).toBeNull();
  });

  it("clamps out-of-range values", () => {
    expect(combineScore({ coverage: 140 })).toBe(100);
  });
});

describe("topicScore", () => {
  const explain = (t: number, coverage: number, accuracy: number): Session => ({
    id: `e${t}`, topicId: "t", mode: "explain", startedAt: t, endedAt: t, messages: [], coverage, accuracy,
  });
  const challenge: Challenge = {
    id: "c", topicId: "t", scenario: "", createdAt: 5,
    rubric: [
      { criterion: "a", score: 2, feedback: "" },
      { criterion: "b", score: 1, feedback: "" },
      { criterion: "c", score: 0, feedback: "" },
    ],
  };

  it("uses the latest explain session", () => {
    expect(topicScore([explain(1, 10, 10), explain(2, 80, 80)], [])).toBe(80);
  });

  it("respects asOf for history", () => {
    expect(topicScore([explain(1, 10, 10), explain(9, 80, 80)], [], 5)).toBe(10);
  });

  it("averages rubric scores out of 6", () => {
    expect(rubricPercent(challenge)).toBe(50);
    expect(topicScore([], [challenge])).toBe(50);
  });
});
