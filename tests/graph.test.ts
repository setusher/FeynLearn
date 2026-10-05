import { describe, expect, it } from "vitest";
import { coverageOf, findPrevious, sanitizeConcepts } from "@/lib/graph";
import type { Concept } from "@/lib/types";

const c = (id: string, dependsOn: string[] = [], label = id): Concept => ({
  id, label, status: "solid", evidence: "not mentioned", note: "", dependsOn,
});

describe("sanitizeConcepts", () => {
  it("drops unknown and self dependencies", () => {
    const out = sanitizeConcepts([c("a", ["a", "zzz"]), c("b", ["a"])]);
    expect(out.find((x) => x.id === "a")!.dependsOn).toEqual([]);
    expect(out.find((x) => x.id === "b")!.dependsOn).toEqual(["a"]);
  });

  it("breaks cycles", () => {
    const out = sanitizeConcepts([c("a", ["c"]), c("b", ["a"]), c("c", ["b"])]);
    const edges = out.reduce((n, x) => n + x.dependsOn.length, 0);
    expect(edges).toBe(2);
  });

  it("makes ids unique slugs", () => {
    const out = sanitizeConcepts([c("Axial Tilt"), c("axial-tilt")]);
    expect(out.map((x) => x.id)).toEqual(["axial-tilt", "axial-tilt-2"]);
  });
});

describe("coverageOf", () => {
  it("counts shaky as half", () => {
    expect(coverageOf([{ status: "solid" }, { status: "shaky" }, { status: "missing" }, { status: "solid" }])).toBe(63);
  });
});

describe("findPrevious", () => {
  it("matches by id, then by label", () => {
    const prev = [c("tilt", [], "Axis is tilted"), c("x", [], "Day length")];
    expect(findPrevious(c("tilt"), prev)?.id).toBe("tilt");
    expect(findPrevious(c("other", [], "day length"), prev)?.id).toBe("x");
  });
});
