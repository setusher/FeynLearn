import type { Challenge, Note, Session, Topic } from "@/lib/types";

export type DashData = {
  topics: Topic[];
  sessions: Session[];
  challenges: Challenge[];
  notes: Note[];
  now: number;
};

/** Finished time for sorting, falling back to the start. */
export const finishedAt = (s: Session) => s.endedAt ?? s.startedAt;

export const isAnalyzed = (s: Session) => s.mode === "explain" && (s.concepts?.length ?? 0) > 0;
