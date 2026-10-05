import { db, getOrCreateTopic, newId } from "./db";
import type { AnalyzeResponse } from "./schemas";
import { topicScore } from "./score";
import { schedule } from "./sm2";
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

/** Most recent analyzed explain session for a topic, optionally excluding one session. */
export async function previousAnalysis(topicId: string, excludeId?: string): Promise<Session | undefined> {
  const sessions = await db.sessions.where("topicId").equals(topicId).toArray();
  return sessions
    .filter((s) => s.id !== excludeId && s.mode === "explain" && s.concepts?.length)
    .sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt))[0];
}

/**
 * Store an analysis on a session, end it, and update the topic's score and
 * review schedule. Returns the topic id for navigation.
 */
export async function saveAnalysis(
  sessionId: string,
  analysis: AnalyzeResponse,
  now: number = Date.now(),
): Promise<string> {
  return db.transaction("rw", [db.sessions, db.topics, db.challenges], async () => {
    const session = await db.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    const updated: Session = {
      ...session,
      endedAt: session.endedAt ?? now,
      concepts: analysis.concepts,
      misconceptions: analysis.misconceptions,
      summary: analysis.summary,
      coverage: analysis.scores.coverage,
      accuracy: analysis.scores.accuracy,
    };
    const [sessions, challenges, topic] = await Promise.all([
      db.sessions.where("topicId").equals(session.topicId).toArray(),
      db.challenges.where("topicId").equals(session.topicId).toArray(),
      db.topics.get(session.topicId),
    ]);
    const all = sessions.map((s) => (s.id === sessionId ? updated : s));
    updated.score = topicScore(all, challenges) ?? undefined;
    await db.sessions.put(updated);

    if (topic && updated.score !== undefined) {
      const next = schedule(topic, updated.score, now);
      await db.topics.update(topic.id, { ...next, latestScore: updated.score });
    }
    return session.topicId;
  });
}
