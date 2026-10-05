const DAY_MS = 24 * 60 * 60 * 1000;

export function formatDate(t: number | undefined): string {
  if (t === undefined) return "-";
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "Today", "Tomorrow", "In 3 days", "2 days ago". */
export function relativeDay(t: number | undefined, now = Date.now()): string {
  if (t === undefined) return "-";
  const a = new Date(t);
  const b = new Date(now);
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const diff = Math.round((a.getTime() - b.getTime()) / DAY_MS);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
