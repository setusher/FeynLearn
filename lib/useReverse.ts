"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { ApiError, postJson } from "./client";
import { db } from "./db";
import { notesExcerptFor } from "./noteStore";
import type { ReverseGenerateResponse, ReverseJudgeResponse, ReverseRequest } from "./schemas";
import { discardSession, previousAnalysis, saveReverseProgress, saveReverseResult, startSession } from "./sessions";
import { clearActive, patchActive } from "./settings";
import type { ActiveSession, Difficulty, ReverseResult, Session } from "./types";

/**
 * Catch the mistake: generate an explanation with planted errors, flag paragraphs,
 * reveal. The `hasError` flags live only in IndexedDB and React state; views must
 * not render them until `revealed` is true.
 */
export function useReverse(active: ActiveSession) {
  const difficulty: Difficulty = active.difficulty ?? "moderate";
  const session = useLiveQuery(
    () => (active.sessionId ? db.sessions.get(active.sessionId) : Promise.resolve(undefined)),
    [active.sessionId],
  ) as Session | undefined;
  const loading = active.sessionId !== undefined && session === undefined;
  const result: ReverseResult | undefined = session?.reverse;
  const revealed = Boolean(result?.verdicts);

  const [busy, setBusy] = useState<"generating" | "judging" | null>(null);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);

  async function generate() {
    setError(null);
    setBusy("generating");
    try {
      const existing = await db.topics.filter((t) => t.name.toLowerCase() === active.topic.toLowerCase()).first();
      const map = existing ? await previousAnalysis(existing.id) : undefined;
      const body: ReverseRequest = {
        action: "generate",
        topic: active.topic,
        difficulty,
        notesExcerpt: await notesExcerptFor(active.topic),
        concepts: map?.concepts?.map(({ id, label }) => ({ id, label })),
      };
      const res = await postJson<ReverseGenerateResponse>("/api/reverse", body);
      if (session && !revealed) await discardSession(session.id);
      const created = await startSession({
        topicName: active.topic,
        mode: "reverse",
        messages: [],
        reverse: { difficulty, paragraphs: res.paragraphs, flags: [] },
      });
      await patchActive({ sessionId: created.id, startedAt: Date.now() });
    } catch (err) {
      setError({ message: err instanceof ApiError ? err.message : "Could not write an explanation.", retry: generate });
    } finally {
      setBusy(null);
    }
  }

  async function setFlag(index: number, reason: string | null) {
    if (!session || !result) return;
    const flags = result.flags.filter((f) => f.index !== index);
    if (reason !== null) flags.push({ index, reason });
    flags.sort((a, b) => a.index - b.index);
    await saveReverseProgress(session.id, { ...result, flags });
  }

  async function reveal() {
    if (!session || !result) return;
    setError(null);
    setBusy("judging");
    try {
      const body: ReverseRequest = { action: "judge", topic: active.topic, paragraphs: result.paragraphs, flags: result.flags };
      const res = await postJson<ReverseJudgeResponse>("/api/reverse", body);
      await saveReverseResult(session.id, { ...result, verdicts: res.verdicts, falseAlarms: res.falseAlarms, score: res.score });
    } catch (err) {
      setError({ message: err instanceof ApiError ? err.message : "Could not check your flags.", retry: reveal });
    } finally {
      setBusy(null);
    }
  }

  async function discard() {
    if (session && !revealed) await discardSession(session.id);
    await clearActive();
  }

  return { difficulty, session, loading, result, revealed, busy, error, generate, setFlag, reveal, discard };
}

export type ReverseState = ReturnType<typeof useReverse>;
