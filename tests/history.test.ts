import { describe, expect, it } from "vitest";
import { scoreHistory } from "@/lib/history";
import type { Challenge, Session } from "@/lib/types";

const explain = (t: number, coverage: number): Session => ({
  id: `e${t}`, topicId: "t", mode: "explain", startedAt: t, endedAt: t, messages: [], coverage, accuracy: coverage,
});

describe("scoreHistory", () => {
  it("adds one point per finished activity, in time order", () => {
    const challenge: Challenge = {
      id: "c", topicId: "t", scenario: "", createdAt: 15,
      rubric: [{ criterion: "a", score: 2, feedback: "" }],
    };
    const unanalyzed: Session = { id: "u", topicId: "t", mode: "explain", startedAt: 12, messages: [] };
    const points = scoreHistory([explain(20, 80), explain(10, 20), unanalyzed], [challenge]);
    expect(points.map((p) => p.at)).toEqual([10, 15, 20]);
    expect(points[0].score).toBe(20);
    expect(points.map((p) => p.activity)).toEqual(["Explain session", "Apply it", "Explain session"]);
  });

  it("skips ungraded challenges", () => {
    const c: Challenge = { id: "c", topicId: "t", scenario: "", createdAt: 1 };
    expect(scoreHistory([], [c])).toEqual([]);
  });
});
