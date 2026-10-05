// Simplified SM-2 scheduler.
//
// Intervals step through 1, 3, 7, 14, 30 days. Past 30 days the interval grows
// by the topic's ease factor. The ease factor is adjusted with the classic
// SM-2 formula, using the 0-100 understanding score mapped to a 0-5 quality.
//
//   score < 50   -> poor: interval resets to 1 day
//   score 50-69  -> shaky: repeat the current interval
//   score >= 70  -> good: advance to the next interval

export const INTERVALS = [1, 3, 7, 14, 30] as const;
export const POOR_THRESHOLD = 50;
export const GOOD_THRESHOLD = 70;
export const MIN_EASE = 1.3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type Schedule = { intervalDays: number; ease: number; nextReview: number };

export function nextEase(ease: number, score: number): number {
  const q = Math.max(0, Math.min(5, score / 20));
  const updated = ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Math.max(MIN_EASE, Math.round(updated * 100) / 100);
}

function nextStep(current: number, ease: number): number {
  const step = INTERVALS.find((d) => d > current);
  if (step !== undefined) return step;
  return Math.round(current * ease);
}

export function schedule(
  prev: { intervalDays: number; ease: number },
  score: number,
  now: number = Date.now(),
): Schedule {
  const ease = nextEase(prev.ease, score);
  let intervalDays: number;
  if (score < POOR_THRESHOLD) {
    intervalDays = INTERVALS[0];
  } else if (score < GOOD_THRESHOLD) {
    intervalDays = Math.max(INTERVALS[0], prev.intervalDays);
  } else {
    intervalDays = nextStep(prev.intervalDays, ease);
  }
  return { intervalDays, ease, nextReview: now + intervalDays * DAY_MS };
}

export function isDue(nextReview: number | undefined, now: number = Date.now()): boolean {
  return nextReview !== undefined && nextReview <= now;
}
