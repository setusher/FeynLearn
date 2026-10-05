import Dexie, { type EntityTable } from "dexie";
import type { Challenge, Note, Session, Topic } from "./types";

// Browser-only persistence. Import this module from client components only.
class FeynDB extends Dexie {
  topics!: EntityTable<Topic, "id">;
  sessions!: EntityTable<Session, "id">;
  challenges!: EntityTable<Challenge, "id">;
  notes!: EntityTable<Note, "id">;

  constructor() {
    super("feynlearn");
    this.version(1).stores({
      topics: "id, name, createdAt, nextReview",
      sessions: "id, topicId, startedAt",
      challenges: "id, topicId, createdAt",
      notes: "id, createdAt",
    });
  }
}

export const db = new FeynDB();

export function newId(): string {
  return crypto.randomUUID();
}

/** Find a topic by name (case-insensitive) or create it. */
export async function getOrCreateTopic(name: string): Promise<Topic> {
  const clean = name.trim();
  const existing = await db.topics
    .filter((t) => t.name.toLowerCase() === clean.toLowerCase())
    .first();
  if (existing) return existing;
  const topic: Topic = {
    id: newId(),
    name: clean,
    createdAt: Date.now(),
    intervalDays: 0,
    ease: 2.5,
  };
  await db.topics.add(topic);
  return topic;
}

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", [db.topics, db.sessions, db.challenges, db.notes], async () => {
    await Promise.all([
      db.topics.clear(),
      db.sessions.clear(),
      db.challenges.clear(),
      db.notes.clear(),
    ]);
  });
}

export async function exportAllData(): Promise<string> {
  const [topics, sessions, challenges, notes] = await Promise.all([
    db.topics.toArray(),
    db.sessions.toArray(),
    db.challenges.toArray(),
    db.notes.toArray(),
  ]);
  return JSON.stringify(
    { app: "feynlearn", exportedAt: new Date().toISOString(), topics, sessions, challenges, notes },
    null,
    2,
  );
}
