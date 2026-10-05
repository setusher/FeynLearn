import { db } from "./db";
import { topicScore } from "./score";
import { schedule } from "./sm2";

/**
 * Recompute a topic's understanding score from everything stored for it, save it
 * as the topic's latest score and move its next review with the SM-2 schedule.
 * Call after any activity finishes (analysis, catch the mistake, graded challenge).
 */
export async function rescoreTopic(topicId: string, now: number = Date.now()): Promise<number | undefined> {
  return db.transaction("rw", [db.sessions, db.topics, db.challenges], async () => {
    const [sessions, challenges, topic] = await Promise.all([
      db.sessions.where("topicId").equals(topicId).toArray(),
      db.challenges.where("topicId").equals(topicId).toArray(),
      db.topics.get(topicId),
    ]);
    const score = topicScore(sessions, challenges) ?? undefined;
    if (topic && score !== undefined) {
      await db.topics.update(topicId, { ...schedule(topic, score, now), latestScore: score });
    }
    return score;
  });
}
