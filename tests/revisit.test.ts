import { describe, expect, it } from "vitest";
import { nextAngle, nextPersona, revisitPlan } from "@/lib/revisit";
import type { Topic } from "@/lib/types";

const topic = (lastAngle?: Topic["lastAngle"]): Topic => ({
  id: "t1", name: "Why do seasons happen?", createdAt: 0, intervalDays: 1, ease: 2.5, lastAngle,
});

describe("revisit angles", () => {
  it("rotates through all four angles and wraps", () => {
    expect([undefined, "persona", "analogy", "apply", "reverse"].map((a) => nextAngle(a as Topic["lastAngle"])))
      .toEqual(["persona", "analogy", "apply", "reverse", "persona"]);
  });

  it("never repeats the last persona", () => {
    expect(nextPersona("child")).not.toBe("child");
    expect(nextPersona("professor")).not.toBe("professor");
    expect(nextPersona(undefined)).toBeDefined();
  });

  it("describes the angle in plain text and links to the right place", () => {
    const p = revisitPlan(topic("reverse"), "child");
    expect(p.angle).toBe("persona");
    expect(p.description).toBe("This time: explain it to a skeptical friend.");
    expect(p.href).toContain("persona=friend");
    expect(revisitPlan(topic("analogy"), "child").href).toBe("/apply?topic=t1");
  });
});
