import { db, getOrCreateTopic, newId } from "./db";
import { rescoreTopic } from "./progress";
import type { Challenge, RubricItem } from "./types";

export async function createChallenge(topicName: string, scenario: string): Promise<Challenge> {
  const topic = await getOrCreateTopic(topicName);
  const challenge: Challenge = { id: newId(), topicId: topic.id, scenario, createdAt: Date.now() };
  await db.challenges.add(challenge);
  return challenge;
}

export async function saveDraftAnswer(id: string, answer: string): Promise<void> {
  await db.challenges.update(id, { answer });
}

export async function saveGrade(
  id: string,
  grade: { answer: string; rubric: RubricItem[]; modelAnswer: string },
): Promise<void> {
  await db.transaction("rw", [db.sessions, db.topics, db.challenges], async () => {
    const challenge = await db.challenges.get(id);
    if (!challenge) throw new Error("Challenge not found");
    await db.challenges.update(id, grade);
    await rescoreTopic(challenge.topicId);
  });
}

export async function deleteChallenge(id: string): Promise<void> {
  await db.challenges.delete(id);
}

export const rubricTotal = (rubric: RubricItem[] | undefined) =>
  rubric ? rubric.reduce((a, r) => a + r.score, 0) : undefined;
