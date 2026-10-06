"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/session/MicButton";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Chip, SampleChip } from "@/components/ui/Chip";
import { Working } from "@/components/ui/Working";
import { createChallenge, deleteChallenge, rubricTotal, saveDraftAnswer, saveGrade } from "@/lib/challenges";
import { ApiError, postJson } from "@/lib/client";
import { formatDate } from "@/lib/format";
import { notesExcerptFor } from "@/lib/noteStore";
import { useAllData } from "@/lib/hooks";
import type { ChallengeGenerateResponse, ChallengeGradeResponse, ChallengeRequest } from "@/lib/schemas";
import { useSpeechInput } from "@/lib/speech";
import { useUI } from "@/lib/store";
import type { Challenge } from "@/lib/types";
import { RubricBars } from "./RubricBars";

const NEW_TOPIC = "__new__";

export function ApplyIt({ topicParam, focus }: { topicParam?: string; focus?: string }) {
  const data = useAllData();
  const router = useRouter();
  const setCurrentTopic = useUI((s) => s.setCurrentTopic);
  const currentTopic = useUI((s) => s.currentTopic);
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
  // Default to the topic in focus (top bar), then the most recently created one.
  const inFocus = topics.find((t) => t.name.toLowerCase() === currentTopic.trim().toLowerCase());
  const newest = [...topics].sort((a, b) => b.createdAt - a.createdAt)[0];
  const selectedId = choice ?? inFocus?.id ?? newest?.id ?? NEW_TOPIC;
  const topic = topics.find((t) => t.id === selectedId);

  useEffect(() => {
    if (topic) setCurrentTopic(topic.name);
  }, [topic, setCurrentTopic]);

  if (!data) return <Working />;

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

  const shownRubric = current?.rubric;
  const smallSelect =
    "h-8 max-w-[240px] rounded-[10px] border border-line bg-card-2 px-2 text-[12px] font-semibold text-text hover:border-text-3";

  return (
    <div className="grid gap-4 desk:h-[calc(100vh-121px)] desk:min-h-[680px] desk:grid-cols-12 desk:grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <h1 className="sr-only">Apply it</h1>
      <Box
        id="apply-main"
        title="Apply it"
        className="min-h-[520px] desk:col-span-7 desk:row-span-3 desk:min-h-0"
        extra={
          <>
            {topic?.sample && <SampleChip />}
            <label htmlFor="apply-topic" className="sr-only">Topic</label>
            <select
              id="apply-topic"
              value={selectedId}
              className={smallSelect}
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
            </select>
            <Button className="h-8 px-3 text-[12px]" onClick={generate} disabled={busy !== null}>
              {busy === "generating" ? "Writing..." : current ? "New scenario" : "Generate scenario"}
            </Button>
          </>
        }
        bodyClassName="gap-3"
      >
        {selectedId === NEW_TOPIC && (
          <div className="shrink-0">
            <label htmlFor="apply-new" className="mb-1 block text-[13px] text-text-2">New topic</label>
            <input
              id="apply-new"
              value={newName}
              maxLength={120}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="How do vaccines work?"
              className="h-10 w-full rounded-[12px] border border-line bg-card-2 px-3 text-[14px] text-text placeholder:text-text-3"
            />
          </div>
        )}
        {focus && <Chip className="self-start">Focus: {focus}</Chip>}
        {error && (
          <div role="alert" className="shrink-0 rounded-[12px] border border-line border-l-[3px] border-l-missing bg-tint-missing px-3 py-2.5 text-[13px]">
            <p>{error.message}</p>
            <button type="button" onClick={error.retry} className="mt-1 font-semibold text-lime underline underline-offset-2">Try again</button>
          </div>
        )}
        {busy === "generating" ? (
          <Working label="Writing a realistic scenario..." />
        ) : !current ? (
          <div className="flex flex-col gap-3 rounded-[12px] border border-line bg-card-2 p-4">
            <p className="text-[15px] font-semibold">Use the idea on a real situation.</p>
            <p className="text-[13px] text-text-2">
              You get a concrete scenario with names and numbers. Answer it in your own words, then get scored on using
              the concept, sound reasoning, and seeing its limits.
            </p>
            <Button className="self-start" onClick={generate}>Generate scenario</Button>
          </div>
        ) : (
          <>
            <div className="shrink-0 rounded-[12px] border border-line bg-card-2 p-4">
              <p className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-text-2">
                <span>Scenario</span>
                <span className="tnum font-semibold normal-case tracking-normal">{formatDate(current.createdAt)}</span>
              </p>
              <p className="mt-1.5 max-h-48 overflow-y-auto text-[15px] leading-relaxed">{current.scenario}</p>
            </div>
            {current.rubric ? (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-text-2">Your answer</p>
                <p className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded-[12px] border border-lime p-3 text-[14px]">{current.answer}</p>
                <Button className="self-start" onClick={generate}>Next scenario</Button>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <label htmlFor="apply-answer" className="text-[13px] font-semibold">Your answer</label>
                <textarea
                  id="apply-answer"
                  maxLength={4000}
                  value={draft}
                  onChange={(e) => setAnswer(e.target.value)}
                  onBlur={() => void saveDraftAnswer(current.id, draft)}
                  placeholder="Explain what is going on and why. Say what you are assuming."
                  className="min-h-[160px] flex-1 resize-none rounded-[12px] border border-line bg-card-2 p-3 text-[15px] text-text placeholder:text-text-3 focus:border-lime"
                />
                <div className="flex flex-wrap items-center gap-2">
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
                  {busy === "grading" ? (
                    <Working label="Checking your answer..." />
                  ) : (
                    <Button onClick={() => grade(current)} disabled={!draft.trim()}>Submit answer</Button>
                  )}
                </div>
                {voice.error && <p className="text-[13px] text-missing" role="alert">{voice.error}</p>}
              </div>
            )}
          </>
        )}
      </Box>

      <Box id="apply-rubric" title="Rubric" className="desk:col-span-5" bodyClassName="gap-2 overflow-y-auto"
        extra={shownRubric ? <span className="tnum text-[20px] font-bold text-lime">{rubricTotal(shownRubric)}<span className="text-[12px] text-text-2"> / 6</span></span> : undefined}
      >
        <RubricBars rubric={shownRubric} />
      </Box>

      <Box id="apply-model" title="Model answer" className="desk:col-span-5" bodyClassName="overflow-y-auto">
        {current?.rubric && current.modelAnswer ? (
          <p className="border-l-2 border-lime pl-3 text-[14px] leading-relaxed">{current.modelAnswer}</p>
        ) : (
          <p className="text-[13px] text-text-2">Revealed after you submit, so you answer first without peeking.</p>
        )}
      </Box>

      <Box id="apply-history" title="History" className="desk:col-span-5" bodyClassName="overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-[13px] text-text-2">Graded challenges for this topic appear here.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {history.map((c) => (
              <li key={c.id} className="rounded-[10px] border border-line bg-card-2">
                <details>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[13px]">
                    <span className="truncate">{c.scenario}</span>
                    <span className="tnum shrink-0 text-text-2">{formatDate(c.createdAt)} · <span className="font-bold text-lime">{rubricTotal(c.rubric)}</span>/6</span>
                  </summary>
                  <div className="flex flex-col gap-2 border-t border-line px-3 py-2 text-[13px]">
                    <p>{c.scenario}</p>
                    <p className="text-text-2"><span className="font-semibold text-text">Your answer:</span> {c.answer}</p>
                    <RubricBars rubric={c.rubric} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Box>
    </div>
  );
}
