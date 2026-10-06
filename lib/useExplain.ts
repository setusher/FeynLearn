"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { ApiError, postJson } from "./client";
import { db } from "./db";
import { notesExcerptFor } from "./noteStore";
import { isPersonaId, type PersonaId } from "./personas";
import { openingLine } from "./prompts";
import type { AnalyzeRequest, AnalyzeResponse, ChatRequest, ChatResponse } from "./schemas";
import { discardSession, endSession, previousAnalysis, saveAnalysis, saveMessages, startSession } from "./sessions";
import { clearActive, patchActive } from "./settings";
import { useReadAloud } from "./speech";
import type { ActiveSession, Message, Session } from "./types";

export const SOFT_TURN_LIMIT = 8;

/**
 * Everything an Explain session needs: the transcript (live from IndexedDB once
 * the session exists), sending a message, analyzing, ending and discarding.
 */
export function useExplain(active: ActiveSession) {
  const persona: PersonaId = isPersonaId(active.persona) ? active.persona : "child";
  const session = useLiveQuery(
    () => (active.sessionId ? db.sessions.get(active.sessionId) : Promise.resolve(undefined)),
    [active.sessionId],
  ) as Session | undefined;
  const loading = active.sessionId !== undefined && session === undefined;

  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const readAloud = useReadAloud();

  const messages: Message[] = session?.messages ?? [{ role: "ai", text: openingLine(persona, active.topic, active.angle) }];
  const userTurns = messages.filter((m) => m.role === "user").length;
  const started = userTurns > 0 || pending !== null;

  async function send(text: string) {
    setError("");
    setPending(text);
    try {
      const body: ChatRequest = {
        topic: active.topic,
        persona,
        focus: active.focus,
        angle: active.angle,
        notesExcerpt: await notesExcerptFor(active.topic, active.focus),
        history: messages.slice(-40).map(({ role, text: t }) => ({ role, text: t })),
        userMessage: text,
      };
      const res = await postJson<ChatResponse>("/api/chat", body);
      const next: Message[] = [
        ...messages,
        { role: "user", text },
        { role: "ai", text: res.reply, ...(res.misconception ? { misconception: res.misconception } : {}) },
      ];
      if (session) {
        await saveMessages(session.id, next);
      } else {
        const created = await startSession({
          topicName: active.topic,
          mode: "explain",
          persona,
          focus: active.focus,
          angle: active.angle,
          messages: next,
        });
        await patchActive({ sessionId: created.id });
      }
      setPending(null);
      readAloud.speak(res.reply);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your message. Please try again.");
    }
  }

  function retry() {
    if (pending) void send(pending);
  }

  function dropPending() {
    setPending(null);
    setError("");
  }

  async function analyze(): Promise<boolean> {
    if (!session) return false;
    setAnalyzeError("");
    setAnalyzing(true);
    try {
      const previous = await previousAnalysis(session.topicId, session.id);
      const body: AnalyzeRequest = {
        topic: active.topic,
        focus: active.focus,
        notesExcerpt: await notesExcerptFor(active.topic, active.focus),
        transcript: session.messages.slice(-42).map(({ role, text }) => ({ role, text })),
        previousConcepts: previous?.concepts?.map(({ id, label }) => ({ id, label })),
      };
      const result = await postJson<AnalyzeResponse>("/api/analyze", body);
      await saveAnalysis(session.id, result);
      await patchActive({ view: "result" });
      return true;
    } catch (err) {
      setAnalyzeError(err instanceof ApiError ? err.message : "Could not save the analysis. Please try again.");
      return false;
    } finally {
      setAnalyzing(false);
    }
  }

  async function endWithoutAnalysis() {
    if (session) await endSession(session.id);
    await clearActive();
  }

  async function discard() {
    if (session) await discardSession(session.id);
    await clearActive();
  }

  return {
    persona,
    session,
    loading,
    messages,
    userTurns,
    started,
    pending,
    error,
    analyzing,
    analyzeError,
    readAloud,
    send,
    retry,
    dropPending,
    analyze,
    endWithoutAnalysis,
    discard,
  };
}

export type ExplainState = ReturnType<typeof useExplain>;
