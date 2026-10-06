import { keywords } from "./notes";

/**
 * Rough live signal for the /session side panel: a concept counts as "mentioned"
 * when the student's messages contain at least half of the concept's keywords
 * (minimum one). The real judgement happens in /api/analyze.
 */
export function conceptMentioned(label: string, studentTexts: string[]): boolean {
  const want = [...keywords(label)];
  if (want.length === 0) return false;
  const said = keywords(studentTexts.join(" "));
  const hits = want.filter((w) => said.has(w)).length;
  return hits >= Math.max(1, Math.ceil(want.length / 2));
}

/** Most frequent keywords the student has used, for when there is no map yet. */
export function topTerms(studentTexts: string[], limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const text of studentTexts) {
    for (const w of keywords(text)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([w]) => w);
}
