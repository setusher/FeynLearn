import Dexie, { type EntityTable } from "dexie";
import type { Challenge, Note, Session, Settings, Topic } from "./types";

// Browser-only persistence. Import this module from client components only.
class FeynDB extends Dexie {
  topics!: EntityTable<Topic, "id">;
  sessions!: EntityTable<Session, "id">;
  challenges!: EntityTable<Challenge, "id">;
  notes!: EntityTable<Note, "id">;
  settings!: EntityTable<Settings, "key">;

  constructor() {
    super("feynlearn");
    this.version(1).stores({
      topics: "id, name, createdAt, nextReview",
      sessions: "id, topicId, startedAt",
      challenges: "id, topicId, createdAt",
      notes: "id, createdAt",
    });
    // v2: settings table (name, theme, seeded flag).
    this.version(2).stores({
      topics: "id, name, createdAt, nextReview",
      sessions: "id, topicId, startedAt",
      challenges: "id, topicId, createdAt",
      notes: "id, createdAt",
      settings: "key",
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

/**
 * Delete all topics, sessions, challenges and notes. Settings keep the name and
 * stay marked as seeded, so demo data is not auto-loaded again ("Load demo data"
 * in Settings brings it back on request).
 */
export async function clearAllData(): Promise<void> {
  await db.transaction("rw", [db.topics, db.sessions, db.challenges, db.notes, db.settings], async () => {
    await Promise.all([
      db.topics.clear(),
      db.sessions.clear(),
      db.challenges.clear(),
      db.notes.clear(),
    ]);
    const settings = await db.settings.get("app");
    await db.settings.put({ key: "app", theme: "dark", name: settings?.name, seeded: true });
  });
}

export async function exportAllData(): Promise<string> {
  const [topics, sessions, challenges, notes, settings] = await Promise.all([
    db.topics.toArray(),
    db.sessions.toArray(),
    db.challenges.toArray(),
    db.notes.toArray(),
    db.settings.toArray(),
  ]);
  return JSON.stringify(
    { app: "feynlearn", exportedAt: new Date().toISOString(), settings, topics, sessions, challenges, notes },
    null,
    2,
  );
}
