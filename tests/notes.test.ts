import { describe, expect, it } from "vitest";
import { excerptFor } from "@/lib/notes";

const filler = (word: string, n: number) => Array.from({ length: n }, (_, i) => `${word} sentence number ${i} about nothing much.`).join(" ");

describe("excerptFor", () => {
  it("returns short notes whole", () => {
    expect(excerptFor("Short note.", "anything")).toBe("Short note.");
  });

  it("stays under the cap and prefers chunks matching the topic", () => {
    const text = [filler("Cooking", 60), "Seasons happen because the axial tilt changes the angle of sunlight.", filler("Gardening", 60)].join("\n\n");
    const out = excerptFor(text, "Why do seasons happen? tilt", 1200);
    expect(out.length).toBeLessThanOrEqual(1200);
    expect(out).toContain("axial tilt");
  });

  it("falls back to the start when nothing matches", () => {
    const text = filler("Cooking", 200);
    expect(excerptFor(text, "quantum entanglement", 500)).toBe(text.slice(0, 500));
  });
});
