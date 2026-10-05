import { db, getOrCreateTopic, newId } from "./db";
import type { AnalyzeResponse } from "./schemas";
import { rescoreTopic } from "./progress";
import type { Message, Mode, ReverseResult, Session } from "./types";

// Persistence helpers for sessions. A session record is created on the first
// student message, so opening and leaving the page does not leave empty records.

export async function startSession(args: {
  topicName: string;
  mode: Mode;
  persona?: string;
  focus?: string;
  messages: Message[];
  reverse?: ReverseResult;
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
    ...(args.reverse ? { reverse: args.reverse } : {}),
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
 * Save a finished session, recompute its score snapshot, and update the topic's
 * score and review schedule. Returns the topic id.
 */
async function finishAndScore(updated: Session, now: number): Promise<string> {
  return db.transaction("rw", [db.sessions, db.topics, db.challenges], async () => {
    await db.sessions.put(updated);
    const score = await rescoreTopic(updated.topicId, now);
    await db.sessions.update(updated.id, { score });
    return updated.topicId;
  });
}

/** Store an analysis on an explain session and end it. */
export async function saveAnalysis(
  sessionId: string,
  analysis: AnalyzeResponse,
  now: number = Date.now(),
): Promise<string> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error("Session not found");
  return finishAndScore(
    {
      ...session,
      endedAt: session.endedAt ?? now,
      concepts: analysis.concepts,
      misconceptions: analysis.misconceptions,
      summary: analysis.summary,
      coverage: analysis.scores.coverage,
      accuracy: analysis.scores.accuracy,
    },
    now,
  );
}

/** Store judged results on a catch-the-mistake session and end it. */
export async function saveReverseResult(
  sessionId: string,
  reverse: ReverseResult,
  now: number = Date.now(),
): Promise<string> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error("Session not found");
  return finishAndScore({ ...session, endedAt: now, reverse }, now);
}

export async function saveReverseProgress(sessionId: string, reverse: ReverseResult): Promise<void> {
  await db.sessions.update(sessionId, { reverse });
}
