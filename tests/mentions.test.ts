import { describe, expect, it } from "vitest";
import { conceptMentioned, topTerms } from "@/lib/mentions";

describe("conceptMentioned", () => {
  it("needs at least half of the concept's keywords", () => {
    const said = ["The Earth's axis is tilted, about 23 degrees."];
    expect(conceptMentioned("Earth's axis is tilted about 23.4 degrees", said)).toBe(true);
    expect(conceptMentioned("Sunlight angle sets energy per area", said)).toBe(false);
  });

  it("matches simple plural and -ing forms", () => {
    expect(conceptMentioned("Hemispheres have opposite seasons", ["each hemisphere gets the opposite season"])).toBe(true);
  });
});

describe("topTerms", () => {
  it("ranks keywords by how many messages use them", () => {
    expect(topTerms(["tilt and sun", "tilt and energy", "tilt again"], 2)).toEqual(["tilt", "again"]);
  });
});
