"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/session/MicButton";
import { Button } from "@/components/ui/Button";
import { Label, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ErrorLine, PageHeader, StatusLine } from "@/components/ui/PageHeader";
import { createChallenge, deleteChallenge, rubricTotal, saveDraftAnswer, saveGrade } from "@/lib/challenges";
import { ApiError, postJson } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { notesExcerptFor } from "@/lib/noteStore";
import { useAllData } from "@/lib/hooks";
import type { ChallengeGenerateResponse, ChallengeGradeResponse, ChallengeRequest } from "@/lib/schemas";
import { useSpeechInput } from "@/lib/speech";
import { useUI } from "@/lib/store";
import type { Challenge } from "@/lib/types";
import { ChallengeResult } from "./ChallengeResult";

const NEW_TOPIC = "__new__";

export function ApplyIt({ topicParam, focus }: { topicParam?: string; focus?: string }) {
  const data = useAllData();
  const router = useRouter();
  const setCurrentTopic = useUI((s) => s.setCurrentTopic);
  const [choice, setChoice] = useState<string | null>(topicParam ?? null);
  const [newName, setNewName] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState<"generating" | "grading" | null>(null);
  const [error, setError] = useState<{ message: string; retry: () => void } | null>(null);
  const voiceBase = useRef("");
  const voice = useSpeechInput((finalText, interim) => {
    const spoken = `${finalText}${interim}`.trim();
    setAnswer(`${voiceBase.current}${voiceBase.current && spoken ? " " : ""}${spoken}`.slice(0, 4000));
  });

  const topics = data ? [...data.topics].sort((a, b) => a.name.localeCompare(b.name)) : [];
  const selectedId = choice ?? topics[0]?.id ?? NEW_TOPIC;
  const topic = topics.find((t) => t.id === selectedId);

  useEffect(() => {
    if (topic) setCurrentTopic(topic.name);
  }, [topic, setCurrentTopic]);

  if (!data) return <StatusLine>Loading...</StatusLine>;

  const challenges = topic
    ? data.challenges.filter((c) => c.topicId === topic.id).sort((a, b) => b.createdAt - a.createdAt)
    : [];
  const open = challenges.find((c) => !c.rubric);
  const latestGraded = challenges.find((c) => c.rubric);
  const [current, history] = open
    ? [open, challenges.filter((c) => c.rubric)]
    : [latestGraded, challenges.filter((c) => c.rubric && c.id !== latestGraded?.id)];
  const topicName = topic?.name ?? newName.trim();
  const draft = answer ?? open?.answer ?? "";

  async function generate() {
    if (!topicName) {
      setError({ message: "Enter a topic first.", retry: () => setError(null) });
      return;
    }
    setError(null);
    setBusy("generating");
    try {
      const body: ChallengeRequest = {
        action: "generate",
        topic: topicName,
        focus,
        notesExcerpt: await notesExcerptFor(topicName, focus),
        avoid: challenges.slice(0, 5).map((c) => c.scenario),
      };
      const res = await postJson<ChallengeGenerateResponse>("/api/challenge", body);
      if (open) await deleteChallenge(open.id);
      const created = await createChallenge(topicName, res.scenario);
      setChoice(created.topicId);
      setAnswer("");
      if (!topic) router.replace(`/apply?topic=${encodeURIComponent(created.topicId)}`);
    } catch (err) {
      setError({ message: err instanceof ApiError ? err.message : "Could not create a scenario.", retry: generate });
    } finally {
      setBusy(null);
    }
  }

  async function grade(challenge: Challenge) {
    const text = draft.trim();
    if (!text) return;
    if (voice.listening) voice.stop();
    setError(null);
    setBusy("grading");
    try {
      await saveDraftAnswer(challenge.id, text);
      const body: ChallengeRequest = {
        action: "grade",
        topic: topicName,
        scenario: challenge.scenario,
        answer: text,
        notesExcerpt: await notesExcerptFor(topicName),
      };
      const res = await postJson<ChallengeGradeResponse>("/api/challenge", body);
      await saveGrade(challenge.id, { answer: text, rubric: res.rubric, modelAnswer: res.modelAnswer });
      setAnswer(null);
    } catch (err) {
      setError({
        message: err instanceof ApiError ? err.message : "Could not grade your answer.",
        retry: () => void grade(challenge),
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-[760px]">
      <PageHeader
        title="Apply it"
        intro="Use what you know in a realistic situation. You get feedback on how you used the idea, how you reasoned, and whether you saw its limits."
      />

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[260px] flex-1">
          <Label htmlFor="apply-topic">Topic</Label>
          <Select
            id="apply-topic"
            value={selectedId}
            onChange={(e) => {
              setChoice(e.target.value);
              setAnswer(null);
              setError(null);
            }}
          >
            {topics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
            <option value={NEW_TOPIC}>New topic...</option>
          </Select>
        </div>
        {selectedId === NEW_TOPIC && (
          <div className="min-w-[260px] flex-1">
            <Label htmlFor="apply-new">New topic</Label>
            <TextInput id="apply-new" value={newName} maxLength={120} onChange={(e) => setNewName(e.target.value)} placeholder="How do vaccines work?" />
          </div>
        )}
        <Button onClick={generate} disabled={busy !== null} variant={open ? "secondary" : "primary"}>
          {busy === "generating" ? "Writing a scenario..." : open || current ? "New scenario" : "Generate scenario"}
        </Button>
      </div>
      {focus && <p className="mt-2 text-sm text-ink-2">Focus: {focus}</p>}

      {error && <div className="mt-6"><ErrorLine message={error.message} onRetry={error.retry} /></div>}

      {!current && busy !== "generating" && (
        <p className="mt-8 text-ink-2">
          No challenge yet for this topic. Press &ldquo;Generate scenario&rdquo; to get one.
        </p>
      )}

      {current && (
        <section aria-labelledby="scenario-heading" className="mt-8 border border-line bg-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="scenario-heading" className="text-lg">Scenario</h2>
            <p className="tnum text-sm text-ink-2">{formatDate(current.createdAt)}</p>
          </div>
          <p className="mt-2">{current.scenario}</p>

          {current.rubric ? (
            <div className="mt-6 flex flex-col gap-6">
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-wide text-ink-2">Your answer</p>
                <p className="mt-1 whitespace-pre-wrap">{current.answer}</p>
              </div>
              <ChallengeResult challenge={current} />
            </div>
          ) : (
            <div className="mt-6">
              <Label htmlFor="apply-answer">Your answer</Label>
              <TextArea
                id="apply-answer"
                rows={10}
                maxLength={4000}
                value={draft}
                onChange={(e) => setAnswer(e.target.value)}
                onBlur={() => void saveDraftAnswer(current.id, draft)}
                placeholder="Explain what is going on and why. Say what you are assuming."
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {voice.supported && (
                  <MicButton
                    listening={voice.listening}
                    disabled={busy !== null}
                    onStart={() => {
                      voiceBase.current = draft.trim();
                      voice.start();
                    }}
                    onStop={voice.stop}
                  />
                )}
                <Button onClick={() => grade(current)} disabled={busy !== null || !draft.trim()}>
                  {busy === "grading" ? "Checking your answer..." : "Submit answer"}
                </Button>
              </div>
              {voice.error && <p className="mt-2 text-sm text-missing" role="alert">{voice.error}</p>}
            </div>
          )}
        </section>
      )}

      {history.length > 0 && (
        <section aria-labelledby="history-heading" className="mt-12">
          <h2 id="history-heading" className="mb-3 text-xl">Past challenges</h2>
          <ul className="border-t border-line">
            {history.map((c) => (
              <li key={c.id} className="border-b border-line">
                <details className="group py-3">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4">
                    <span className="line-clamp-1">{c.scenario}</span>
                    <span className="tnum shrink-0 text-sm text-ink-2">
                      {formatDate(c.createdAt)} · {rubricTotal(c.rubric)} / 6
                    </span>
                  </summary>
                  <div className="mt-3 flex flex-col gap-4">
                    <p>{c.scenario}</p>
                    <div>
                      <p className="font-sans text-xs font-semibold uppercase tracking-wide text-ink-2">Your answer</p>
                      <p className="mt-1 whitespace-pre-wrap">{c.answer}</p>
                    </div>
                    <ChallengeResult challenge={c} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
