"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Field";
import { ErrorLine, StatusLine } from "@/components/ui/PageHeader";
import { ApiError, postJson } from "@/lib/client";
import { db } from "@/lib/db";
import type { ReverseGenerateResponse, ReverseJudgeResponse, ReverseRequest } from "@/lib/schemas";
import {
  discardSession,
  previousAnalysis,
  saveReverseProgress,
  saveReverseResult,
  startSession,
} from "@/lib/sessions";
import type { Difficulty, ReverseResult } from "@/lib/types";
import type { ProgressInfo } from "./ExplainChat";
import { FlagPanel } from "./FlagPanel";
import { ReverseResults } from "./ReverseResults";
import { SessionHeader } from "./SessionHeader";

type Phase = "loading" | "setup" | "generating" | "reading" | "judging" | "revealed" | "missing";

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "obvious", label: "Obvious" },
  { value: "moderate", label: "Moderate" },
  { value: "subtle", label: "Subtle" },
];

type Props = {
  topic: string;
  sid?: string;
  toggle: ReactNode;
  banner?: ReactNode;
  onSessionCreated: (sessionId: string) => void;
  onProgress: (info: ProgressInfo) => void;
};

export function ReverseMode({ topic, sid, toggle, banner, onSessionCreated, onProgress }: Props) {
  const [phase, setPhase] = useState<Phase>(sid ? "loading" : "setup");
  const [difficulty, setDifficulty] = useState<Difficulty>("moderate");
  const [sessionId, setSessionId] = useState<string | null>(sid ?? null);
  const [topicId, setTopicId] = useState<string | null>(null);
  // Holds the hasError flags. They live only in state and are never rendered
  // into the DOM until the reveal.
  const [result, setResult] = useState<ReverseResult | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [retry, setRetry] = useState<"generate" | "reveal">("generate");
  const [hasMap, setHasMap] = useState(false);

  useEffect(() => {
    if (!sid) return;
    let cancelled = false;
    db.sessions.get(sid).then((s) => {
      if (cancelled) return;
      if (!s || s.mode !== "reverse" || !s.reverse) {
        setPhase("missing");
        return;
      }
      setResult(s.reverse);
      setDifficulty(s.reverse.difficulty);
      setTopicId(s.topicId);
      setPhase(s.reverse.verdicts ? "revealed" : "reading");
      previousAnalysis(s.topicId).then((m) => !cancelled && setHasMap(Boolean(m)));
    });
    return () => {
      cancelled = true;
    };
  }, [sid]);

  useEffect(() => {
    onProgress({ sessionId, inProgress: phase === "reading" || phase === "judging" });
  }, [onProgress, sessionId, phase]);

  async function generate() {
    setError("");
    setRetry("generate");
    setPhase("generating");
    try {
      const existing = await db.topics.filter((t) => t.name.toLowerCase() === topic.toLowerCase()).first();
      const map = existing ? await previousAnalysis(existing.id) : undefined;
      setHasMap(Boolean(map));
      const body: ReverseRequest = {
        action: "generate",
        topic,
        difficulty,
        concepts: map?.concepts?.map(({ id, label }) => ({ id, label })),
      };
      const res = await postJson<ReverseGenerateResponse>("/api/reverse", body);
      const fresh: ReverseResult = { difficulty, paragraphs: res.paragraphs, flags: [] };
      if (sessionId) await discardSession(sessionId);
      const created = await startSession({ topicName: topic, mode: "reverse", messages: [], reverse: fresh });
      setSessionId(created.id);
      setTopicId(created.topicId);
      onSessionCreated(created.id);
      setResult(fresh);
      setSelected(null);
      setPhase("reading");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start the exercise. Please try again.");
      setPhase(result ? "reading" : "setup");
    }
  }

  async function updateFlags(flags: ReverseResult["flags"]) {
    if (!result || !sessionId) return;
    const next = { ...result, flags: flags.sort((a, b) => a.index - b.index) };
    setResult(next);
    await saveReverseProgress(sessionId, next);
  }

  async function reveal() {
    if (!result || !sessionId) return;
    setConfirmEmpty(false);
    setError("");
    setRetry("reveal");
    setPhase("judging");
    try {
      const body: ReverseRequest = { action: "judge", topic, paragraphs: result.paragraphs, flags: result.flags };
      const res = await postJson<ReverseJudgeResponse>("/api/reverse", body);
      const done: ReverseResult = { ...result, verdicts: res.verdicts, falseAlarms: res.falseAlarms, score: res.score };
      await saveReverseResult(sessionId, done);
      setResult(done);
      setSelected(null);
      setPhase("revealed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not check your flags. Please try again.");
      setPhase("reading");
    }
  }

  function startOver() {
    setResult(null);
    setSessionId(null);
    setSelected(null);
    setPhase("setup");
  }

  if (phase === "loading") return <StatusLine>Loading exercise...</StatusLine>;

  const flagFor = (i: number) => result?.flags.find((f) => f.index === i);

  const actions =
    phase === "reading" ? (
      <>
        <Button onClick={() => (result?.flags.length ? reveal() : setConfirmEmpty(true))}>Finish and reveal</Button>
        <Button variant="secondary" onClick={generate}>New explanation</Button>
      </>
    ) : phase === "judging" ? (
      <Button disabled>Checking...</Button>
    ) : phase === "revealed" ? (
      <Button onClick={startOver}>Try another</Button>
    ) : null;

  const meta =
    phase === "setup" || phase === "generating" ? (
      <div className="min-w-[200px]">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          id="difficulty"
          value={difficulty}
          disabled={phase === "generating"}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          {DIFFICULTY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </Select>
      </div>
    ) : (
      <span>Difficulty: {DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label}</span>
    );

  return (
    <div className="max-w-[1040px]">
      <div className="max-w-[720px]">
        <SessionHeader topic={topic} toggle={toggle} actions={actions} meta={meta} />
        {banner}
        {error && <div className="mb-6"><ErrorLine message={error} onRetry={retry === "reveal" ? reveal : generate} /></div>}
        {phase === "missing" && <ErrorLine message="This exercise could not be found. It may have been cleared." />}
      </div>

      {(phase === "setup" || phase === "generating") && (
        <div className="max-w-[720px]">
          <p>
            You will read a short explanation of this topic with 1 to 3 mistakes planted in it. Click
            each paragraph you think is wrong and say what is wrong. Then reveal the answers.
          </p>
          {phase === "generating" ? (
            <p className="mt-6" role="status">Writing an explanation for you to check...</p>
          ) : (
            <Button className="mt-6" onClick={generate}>Generate explanation</Button>
          )}
        </div>
      )}

      {confirmEmpty && phase === "reading" && (
        <div role="alert" className="mb-6 flex max-w-[720px] flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3 text-sm">
          <span>You have not flagged anything. Reveal anyway?</span>
          <Button onClick={reveal}>Reveal</Button>
          <Button variant="secondary" onClick={() => setConfirmEmpty(false)}>Keep reading</Button>
        </div>
      )}

      {(phase === "reading" || phase === "judging") && result && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,720px)_280px]">
          <div>
            {phase === "judging" && <p className="mb-4" role="status">Checking your flags...</p>}
            <ol className="flex flex-col gap-3">
              {result.paragraphs.map((p, i) => {
                const flag = flagFor(i);
                const active = selected === i;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setSelected(active ? null : i)}
                      aria-pressed={active}
                      disabled={phase === "judging"}
                      className={`flex w-full gap-3 rounded-sm border bg-surface px-4 py-3 text-left transition-colors duration-150 ${
                        active ? "border-accent outline-2 outline-accent" : flag ? "border-ink-2" : "border-line hover:border-ink-2"
                      }`}
                    >
                      <span className="tnum w-5 shrink-0 font-serif text-ink-2">{i + 1}.</span>
                      <span className="flex-1">
                        {p.text}
                        {flag && (
                          <span className="mt-2 block border-t border-line pt-2 text-sm text-ink-2">
                            <span className="font-medium text-ink">Flagged:</span> {flag.reason || "no reason given"}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <FlagPanel
            key={selected ?? "none"}
            index={phase === "judging" ? null : selected}
            existing={selected !== null ? flagFor(selected)?.reason : undefined}
            flagCount={result.flags.length}
            onSubmit={async (reason) => {
              if (selected === null) return;
              await updateFlags([...result.flags.filter((f) => f.index !== selected), { index: selected, reason }]);
              setSelected(null);
            }}
            onRemove={async () => {
              if (selected === null) return;
              await updateFlags(result.flags.filter((f) => f.index !== selected));
              setSelected(null);
            }}
          />
        </div>
      )}

      {phase === "revealed" && result && (
        <div className="max-w-[720px]">
          <ReverseResults result={result} />
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button onClick={startOver}>Try another</Button>
            {topicId && hasMap && (
              <Link href={`/gap-map?topic=${encodeURIComponent(topicId)}`} className={buttonClass("secondary")}>
                Open the Gap map
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
