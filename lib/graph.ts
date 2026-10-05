import type { Concept, ConceptStatus } from "./types";

// Helpers for the concept graph shown on the Gap map.

export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "concept"
  );
}

/**
 * Make LLM-produced concepts safe to render: unique slug ids, dependencies that
 * point at real concepts, no self-references, and no cycles (back edges found by
 * depth-first search are dropped).
 */
export function sanitizeConcepts(concepts: Concept[]): Concept[] {
  const idMap = new Map<string, string>();
  const used = new Set<string>();
  const withIds = concepts.map((c) => {
    let id = slugify(c.id || c.label);
    let n = 2;
    while (used.has(id)) id = `${slugify(c.id || c.label)}-${n++}`;
    used.add(id);
    if (!idMap.has(c.id)) idMap.set(c.id, id);
    return { ...c, id };
  });

  const resolved = withIds.map((c) => ({
    ...c,
    dependsOn: [
      ...new Set(
        c.dependsOn
          .map((d) => idMap.get(d) ?? (used.has(slugify(d)) ? slugify(d) : undefined))
          .filter((d): d is string => d !== undefined && d !== c.id),
      ),
    ],
  }));

  const byId = new Map(resolved.map((c) => [c.id, c]));
  const state = new Map<string, "visiting" | "done">();
  const visit = (id: string) => {
    state.set(id, "visiting");
    const node = byId.get(id)!;
    node.dependsOn = node.dependsOn.filter((dep) => {
      const s = state.get(dep);
      if (s === "visiting") return false; // back edge: would close a cycle
      if (s === undefined) visit(dep);
      return true;
    });
    state.set(id, "done");
  };
  for (const c of resolved) if (!state.has(c.id)) visit(c.id);
  return resolved;
}

/** Coverage 0-100: solid counts fully, shaky half, missing nothing. */
export function coverageOf(concepts: Pick<Concept, "status">[]): number {
  if (concepts.length === 0) return 0;
  const weight: Record<ConceptStatus, number> = { solid: 1, shaky: 0.5, missing: 0 };
  const sum = concepts.reduce((acc, c) => acc + weight[c.status], 0);
  return Math.round((sum / concepts.length) * 100);
}

/** Match a concept to its counterpart in a previous attempt, by id then by label. */
export function findPrevious(concept: Concept, previous: Concept[] | undefined): Concept | undefined {
  if (!previous) return undefined;
  return (
    previous.find((p) => p.id === concept.id) ??
    previous.find((p) => p.label.trim().toLowerCase() === concept.label.trim().toLowerCase())
  );
}

export const STATUS_LABEL: Record<ConceptStatus, string> = {
  solid: "Solid",
  shaky: "Shaky",
  missing: "Missing",
};

export type ReverseEvidence = {
  conceptId: string;
  verdict: "caught" | "partly" | "missed";
  correctFact: string;
  at: number;
};

/** Collect per-concept results from judged catch-the-mistake sessions, newest first. */
export function reverseEvidence(
  sessions: { mode: string; endedAt?: number; startedAt: number; reverse?: {
    paragraphs: { conceptId?: string }[];
    verdicts?: { index: number; verdict: "caught" | "partly" | "missed"; correctFact: string }[];
  } }[],
): ReverseEvidence[] {
  return sessions
    .filter((s) => s.mode === "reverse" && s.reverse?.verdicts)
    .flatMap((s) =>
      (s.reverse!.verdicts ?? []).flatMap((v) => {
        const conceptId = s.reverse!.paragraphs[v.index]?.conceptId;
        return conceptId
          ? [{ conceptId, verdict: v.verdict, correctFact: v.correctFact, at: s.endedAt ?? s.startedAt }]
          : [];
      }),
    )
    .sort((a, b) => b.at - a.at);
}

/**
 * Adjust map statuses with catch-the-mistake results that came after the explain
 * attempt: a missed planted error drops "solid" to "shaky"; a caught one lifts
 * "missing" to "shaky". Explaining stays the stronger evidence, so neither moves
 * a concept further than one step. Returns the adjusted concepts and a note per changed id.
 */
export function applyReverseEvidence(
  concepts: Concept[],
  evidence: ReverseEvidence[],
  after: number,
): { concepts: Concept[]; notes: Record<string, string> } {
  const notes: Record<string, string> = {};
  const adjusted = concepts.map((c) => {
    const latest = evidence.find((e) => e.conceptId === c.id && e.at > after);
    if (!latest) return c;
    if (latest.verdict === "missed" && c.status === "solid") {
      notes[c.id] = "missed in Catch the mistake";
      return { ...c, status: "shaky" as const };
    }
    if (latest.verdict === "caught" && c.status === "missing") {
      notes[c.id] = "caught in Catch the mistake";
      return { ...c, status: "shaky" as const };
    }
    return c;
  });
  return { concepts: adjusted, notes };
}
