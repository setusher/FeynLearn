import { db, getOrCreateTopic, newId } from "./db";
import type { Message, Mode, Session } from "./types";

// Persistence helpers for sessions. A session record is created on the first
// student message, so opening and leaving the page does not leave empty records.

export async function startSession(args: {
  topicName: string;
  mode: Mode;
  persona?: string;
  focus?: string;
  messages: Message[];
}): Promise<Session> {
  const topic = await getOrCreateTopic(args.topicName);
  const session: Session = {
    id: newId(),
    topicId: topic.id,
    mode: args.mode,
    persona: args.persona,
    focus: args.focus,
    startedAt: Date.now(),
    messages: args.messages,
  };
  await db.sessions.add(session);
  return session;
}

export async function saveMessages(sessionId: string, messages: Message[]): Promise<void> {
  await db.sessions.update(sessionId, { messages });
}

export async function endSession(sessionId: string): Promise<void> {
  await db.sessions.update(sessionId, { endedAt: Date.now() });
}

/** Delete a session; also delete its topic if nothing else refers to it. */
export async function discardSession(sessionId: string): Promise<void> {
  await db.transaction("rw", [db.sessions, db.topics, db.challenges], async () => {
    const session = await db.sessions.get(sessionId);
    if (!session) return;
    await db.sessions.delete(sessionId);
    const [others, challenges] = await Promise.all([
      db.sessions.where("topicId").equals(session.topicId).count(),
      db.challenges.where("topicId").equals(session.topicId).count(),
    ]);
    if (others === 0 && challenges === 0) await db.topics.delete(session.topicId);
  });
}
