"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Field";
import { ErrorLine, StatusLine } from "@/components/ui/PageHeader";
import { ApiError, postJson } from "@/lib/client";
import { db } from "@/lib/db";
import { notesExcerptFor } from "@/lib/noteStore";
import { useReadAloud } from "@/lib/speech";
import { PERSONAS, isPersonaId, type PersonaId } from "@/lib/personas";
import { openingLine } from "@/lib/prompts";
import type { AnalyzeRequest, AnalyzeResponse, ChatRequest, ChatResponse } from "@/lib/schemas";
import {
  discardSession,
  endSession,
  previousAnalysis,
  saveAnalysis,
  saveMessages,
  startSession,
} from "@/lib/sessions";
import type { Message } from "@/lib/types";
import { Composer } from "./Composer";
import { NotesInUse } from "./NotesInUse";
import { SessionHeader } from "./SessionHeader";
import { Transcript } from "./Transcript";

export type ProgressInfo = { sessionId: string | null; inProgress: boolean };

type Props = {
  topic: string;
  persona: PersonaId;
  sid?: string;
  focus?: string;
  angle?: "analogy";
  toggle: ReactNode;
  banner?: ReactNode;
  onPersonaChange: (persona: PersonaId) => void;
  onSessionCreated: (sessionId: string) => void;
  onProgress: (info: ProgressInfo) => void;
};

type Phase = "loading" | "active" | "analyzing" | "ended" | "discarded" | "missing";

const SOFT_TURN_LIMIT = 8;

export function ExplainChat(props: Props) {
  const { topic, sid, focus, toggle, banner, onPersonaChange, onSessionCreated, onProgress } = props;
  const [angle, setAngle] = useState(props.angle);
  const [persona, setPersona] = useState<PersonaId>(props.persona);
  const [sessionId, setSessionId] = useState<string | null>(sid ?? null);
  const [messages, setMessages] = useState<Message[]>(() =>
    sid ? [] : [{ role: "ai", text: openingLine(props.persona, topic, props.angle) }],
  );
  const [phase, setPhase] = useState<Phase>(sid ? "loading" : "active");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const [topicId, setTopicId] = useState<string | null>(null);
  const router = useRouter();
  const readAloud = useReadAloud();
  const endRef = useRef<HTMLDivElement>(null);

  // Resume a saved session after a refresh.
  useEffect(() => {
    if (!sid) return;
    let cancelled = false;
    db.sessions.get(sid).then((s) => {
      if (cancelled) return;
      if (!s || s.mode !== "explain") {
        setPhase("missing");
        return;
      }
      setMessages(s.messages);
      setAngle(s.angle);
      setTopicId(s.concepts?.length ? s.topicId : null);
      if (isPersonaId(s.persona)) setPersona(s.persona);
      setPhase(s.endedAt ? "ended" : "active");
    });
    return () => {
      cancelled = true;
    };
  }, [sid]);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const started = userTurns > 0 || pending !== null;

  useEffect(() => {
    onProgress({ sessionId, inProgress: phase === "active" && started });
  }, [onProgress, sessionId, phase, started]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, pending]);

  async function send(text: string) {
    setError("");
    setPending(text);
    try {
      const body: ChatRequest = {
        topic,
        persona,
        focus,
        angle,
        notesExcerpt: await notesExcerptFor(topic, focus),
        history: messages.slice(-40).map(({ role, text: t }) => ({ role, text: t })),
        userMessage: text,
      };
      const res = await postJson<ChatResponse>("/api/chat", body);
      const next: Message[] = [
        ...messages,
        { role: "user", text },
        { role: "ai", text: res.reply, ...(res.misconception ? { misconception: res.misconception } : {}) },
      ];
      if (sessionId) {
        await saveMessages(sessionId, next);
      } else {
        const created = await startSession({ topicName: topic, mode: "explain", persona, focus, angle, messages: next });
        setSessionId(created.id);
        onSessionCreated(created.id);
      }
      setMessages(next);
      setPending(null);
      readAloud.speak(res.reply);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your message. Please try again.");
    }
  }

  function retry() {
    if (pending) void send(pending);
  }

  function editPending() {
    setPending(null);
    setError("");
  }

  async function analyze() {
    if (!sessionId) return;
    const before = phase;
    setAnalyzeError("");
    setPhase("analyzing");
    try {
      const session = await db.sessions.get(sessionId);
      if (!session) throw new Error("missing");
      const previous = await previousAnalysis(session.topicId, sessionId);
      const body: AnalyzeRequest = {
        topic,
        focus,
        notesExcerpt: await notesExcerptFor(topic, focus),
        transcript: session.messages.slice(-42).map(({ role, text }) => ({ role, text })),
        previousConcepts: previous?.concepts?.map(({ id, label }) => ({ id, label })),
      };
      const result = await postJson<AnalyzeResponse>("/api/analyze", body);
      const tid = await saveAnalysis(sessionId, result);
      router.push(`/gap-map?topic=${encodeURIComponent(tid)}&session=${encodeURIComponent(sessionId)}`);
    } catch (err) {
      setAnalyzeError(
        err instanceof ApiError ? err.message : "Could not save the analysis. Please try again.",
      );
      setPhase(before === "ended" ? "ended" : "active");
    }
  }

  async function endWithoutAnalysis() {
    if (!sessionId) return;
    await endSession(sessionId);
    setAnalyzeError("");
    setPhase("ended");
  }

  async function onDiscard() {
    if (sessionId) await discardSession(sessionId);
    setConfirmDiscard(false);
    setPhase("discarded");
  }

  if (phase === "loading") return <StatusLine>Loading session...</StatusLine>;

  const actions =
    phase === "analyzing" ? (
      <Button disabled>Analyzing...</Button>
    ) : phase === "active" ? (
      <>
        <Button onClick={analyze} disabled={!sessionId || pending !== null}>
          End session and analyze
        </Button>
        <Button variant="secondary" onClick={() => setConfirmDiscard(true)} disabled={!started}>
          Discard
        </Button>
      </>
    ) : null;

  const meta = (
    <>
      {!started && phase === "active" ? (
        <div className="min-w-[220px]">
          <Label htmlFor="session-persona">Explain it to</Label>
          <Select
            id="session-persona"
            value={persona}
            onChange={(e) => {
              const p = e.target.value as PersonaId;
              setPersona(p);
              setMessages([{ role: "ai", text: openingLine(p, topic, angle) }]);
              onPersonaChange(p);
            }}
          >
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </div>
      ) : (
        <span>Explaining to: {PERSONAS.find((p) => p.id === persona)?.label}</span>
      )}
      {focus && <span>Focus: {focus}</span>}
      {angle === "analogy" && <span>Angle: explain through an analogy</span>}
      <NotesInUse topic={topic} />
      {readAloud.supported && (
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={readAloud.enabled}
            onChange={(e) => readAloud.setEnabled(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          Read replies aloud
        </label>
      )}
    </>
  );

  return (
    <div className="max-w-[720px]">
      <SessionHeader topic={topic} toggle={toggle} actions={actions} meta={meta} />
      {banner}

      {confirmDiscard && (
        <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3 text-sm">
          <span>Delete this conversation? It will not count toward your progress.</span>
          <Button onClick={onDiscard}>Discard session</Button>
          <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>Keep it</Button>
        </div>
      )}

      {phase === "missing" && (
        <ErrorLine message="This session could not be found. It may have been discarded or cleared." />
      )}

      {phase === "discarded" ? (
        <div className="flex flex-col items-start gap-3">
          <p>Session discarded.</p>
          <Link href="/" className={buttonClass("secondary")}>Back to dashboard</Link>
        </div>
      ) : (
        phase !== "missing" && (
          <>
            <Transcript messages={messages} pending={pending} waiting={pending !== null && !error} />
            {error && (
              <div className="mt-2 flex flex-col gap-2">
                <ErrorLine message={error} onRetry={retry} />
                <button type="button" onClick={editPending} className="self-start text-sm text-accent underline underline-offset-2">
                  Remove this message and rewrite it
                </button>
              </div>
            )}
            <div ref={endRef} />

            {analyzeError && (
              <div className="mt-4 flex flex-col gap-2">
                <ErrorLine message={`Analysis failed. ${analyzeError}`} onRetry={analyze} />
                <button type="button" onClick={endWithoutAnalysis} className="self-start text-sm text-accent underline underline-offset-2">
                  End without analysis
                </button>
              </div>
            )}

            {phase === "analyzing" ? (
              <div className="mt-6" role="status">
                <p>Analyzing your explanation...</p>
                <p className="mt-1 text-sm text-ink-2">
                  Checking which ideas you covered and how they connect. This can take up to half a minute.
                </p>
              </div>
            ) : phase === "active" ? (
              <Composer
                disabled={pending !== null}
                onSend={send}
                hint={
                  userTurns >= SOFT_TURN_LIMIT
                    ? "You have explained a lot. End the session when you are ready."
                    : `Turn ${userTurns + 1} of about ${SOFT_TURN_LIMIT}.`
                }
              />
            ) : (
              <div className="mt-6 border-l-[3px] border-accent bg-surface px-4 py-3">
                {topicId ? (
                  <>
                    <p>This session has ended and was analyzed.</p>
                    <p className="mt-2">
                      <Link
                        href={`/gap-map?topic=${encodeURIComponent(topicId)}&session=${encodeURIComponent(sessionId ?? "")}`}
                        className="underline underline-offset-2"
                      >
                        Open the Gap map
                      </Link>
                    </p>
                  </>
                ) : (
                  <>
                    <p>This session has ended without an analysis.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button onClick={analyze}>Analyze it now</Button>
                      <Link href="/" className="text-sm underline underline-offset-2">Back to dashboard</Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
