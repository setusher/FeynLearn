import { describe, expect, it } from "vitest";
import { INTERVALS, MIN_EASE, isDue, nextEase, schedule } from "@/lib/sm2";

const DAY = 24 * 60 * 60 * 1000;

describe("schedule", () => {
  it("starts a new topic at 1 day after a good score", () => {
    const s = schedule({ intervalDays: 0, ease: 2.5 }, 85, 0);
    expect(s.intervalDays).toBe(1);
    expect(s.nextReview).toBe(1 * DAY);
  });

  it("steps through 1, 3, 7, 14, 30 on good scores", () => {
    let state = { intervalDays: 0, ease: 2.5 };
    const seen: number[] = [];
    for (let i = 0; i < INTERVALS.length; i++) {
      state = schedule(state, 90, 0);
      seen.push(state.intervalDays);
    }
    expect(seen).toEqual([1, 3, 7, 14, 30]);
  });

  it("grows past 30 days by the ease factor", () => {
    const s = schedule({ intervalDays: 30, ease: 2.5 }, 100, 0);
    expect(s.intervalDays).toBe(Math.round(30 * s.ease));
  });

  it("resets to 1 day on a poor score", () => {
    const s = schedule({ intervalDays: 14, ease: 2.5 }, 30, 0);
    expect(s.intervalDays).toBe(1);
  });

  it("repeats the current interval on a shaky score", () => {
    const s = schedule({ intervalDays: 7, ease: 2.5 }, 60, 0);
    expect(s.intervalDays).toBe(7);
  });
});

describe("nextEase", () => {
  it("never drops below the minimum", () => {
    expect(nextEase(1.3, 0)).toBe(MIN_EASE);
  });
  it("rises on a perfect score", () => {
    expect(nextEase(2.5, 100)).toBeGreaterThan(2.5);
  });
});

describe("isDue", () => {
  it("handles missing and past dates", () => {
    expect(isDue(undefined, 10)).toBe(false);
    expect(isDue(5, 10)).toBe(true);
    expect(isDue(15, 10)).toBe(false);
  });
});
