// Choosing which part of a note to send to the AI. Notes stay in the browser;
// only this excerpt (about 6,000 characters at most) goes with a request.

export const EXCERPT_CAP = 6000;
const CHUNK = 800;

const STOP = new Set(
  "a an and are as at be because but by can do does for from how in into is it its of on or so that the their there these this to was what when where which why will with you your".split(
    " ",
  ),
);

export function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map((w) => w.replace(/(ing|ed|es|s)$/, "")),
  );
}

/** Split into roughly CHUNK-sized pieces on paragraph, then sentence, boundaries. */
export function chunk(text: string): string[] {
  const parts = text.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z])/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const p of parts) {
    if (current && current.length + p.length + 1 > CHUNK) {
      chunks.push(current);
      current = "";
    }
    current = current ? `${current}\n${p}` : p;
  }
  if (current) chunks.push(current);
  return chunks.flatMap((c) => (c.length > CHUNK * 2 ? c.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, "g")) ?? [] : [c]));
}

/**
 * The text to send as reference material: the whole note if it fits, otherwise
 * the chunks sharing the most keywords with the query (topic and focus), kept in
 * their original order. Falls back to the start of the note when nothing matches.
 */
export function excerptFor(text: string, query: string, cap: number = EXCERPT_CAP): string {
  const clean = text.trim();
  if (clean.length <= cap) return clean;
  const q = keywords(query);
  const chunks = chunk(clean).map((c, i) => {
    const words = keywords(c);
    let score = 0;
    for (const w of q) if (words.has(w)) score += 1;
    return { c, i, score };
  });
  if (!chunks.some((x) => x.score > 0)) return clean.slice(0, cap);

  const picked: typeof chunks = [];
  let used = 0;
  for (const x of [...chunks].sort((a, b) => b.score - a.score || a.i - b.i)) {
    if (used + x.c.length + 2 > cap) continue;
    picked.push(x);
    used += x.c.length + 2;
  }
  return picked
    .sort((a, b) => a.i - b.i)
    .map((x) => x.c)
    .join("\n\n");
}
