"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { MODE_OPTIONS } from "@/components/dashboard/StartSession";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Chip, SampleChip } from "@/components/ui/Chip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { relativeDay } from "@/lib/format";
import { linkNote } from "@/lib/noteStore";
import { PERSONAS, type PersonaId } from "@/lib/personas";
import { topicScore } from "@/lib/score";
import { DIFFICULTIES } from "@/lib/schemas";
import { useUI } from "@/lib/store";
import type { Difficulty } from "@/lib/types";
import { finishedAt, isAnalyzed, type DashData } from "./types";

const SUGGESTED = ["How do vaccines work?", "Why is the sky blue?", "What is supply and demand?"];

const smallSelect =
  "h-8 rounded-[10px] border border-line bg-card-2 px-2 text-[12px] font-semibold text-text hover:border-text-3";

export function SessionBox({ data, name }: { data: DashData; name?: string }) {
  const router = useRouter();
  const { currentTopic, setCurrentTopic, draftMode, setDraftMode, draftPersona, setDraftPersona } = useUI();
  const [difficulty, setDifficulty] = useState<Difficulty>("moderate");
  const [noteId, setNoteId] = useState("");
  const [error, setError] = useState("");

  const { topics, sessions, challenges, notes, now } = data;
  const unfinished = [...sessions]
    .filter((s) => (s.mode === "explain" ? !s.endedAt && s.messages.length > 1 : !s.reverse?.verdicts))
    .sort((a, b) => b.startedAt - a.startedAt)[0];
  const unfinishedTopic = topics.find((t) => t.id === unfinished?.topicId);
  const last = [...sessions].filter(isAnalyzed).sort((a, b) => finishedAt(b) - finishedAt(a))[0];
  const lastTopic = topics.find((t) => t.id === last?.topicId);
  const recent = topics
    .map((t) => ({
      topic: t,
      at: Math.max(t.createdAt, ...sessions.filter((s) => s.topicId === t.id).map(finishedAt)),
      score: topicScore(
        sessions.filter((s) => s.topicId === t.id),
        challenges.filter((c) => c.topicId === t.id),
      ),
    }))
    .sort((a, b) => b.at - a.at)
    .slice(0, 4);

  async function begin(e: FormEvent) {
    e.preventDefault();
    const topic = currentTopic.trim();
    if (!topic) {
      setError("Type a topic first, or pick one of the suggestions.");
      return;
    }
    if (noteId) await linkNote({ name: topic }, noteId);
    const qs = new URLSearchParams({ topic, mode: draftMode });
    if (draftMode === "explain") qs.set("persona", draftPersona);
    router.push(`/session?${qs.toString()}`);
  }

  const resumeHref =
    unfinished && unfinishedTopic
      ? `/session?${new URLSearchParams({
          topic: unfinishedTopic.name,
          mode: unfinished.mode,
          ...(unfinished.persona ? { persona: unfinished.persona } : {}),
          sid: unfinished.id,
        }).toString()}`
      : null;

  return (
    <Box
      id="session"
      title="Session"
      href="/session"
      className="area-a"
      extra={
        <div className="hidden items-center gap-2 tab:flex">
          <SegmentedToggle label="Session mode" options={MODE_OPTIONS} value={draftMode} onChange={setDraftMode} />
          {draftMode === "explain" ? (
            <label className="sr-only" htmlFor="box-persona">Explain it to</label>
          ) : (
            <label className="sr-only" htmlFor="box-difficulty">Difficulty</label>
          )}
          {draftMode === "explain" ? (
            <select
              id="box-persona"
              value={draftPersona}
              onChange={(e) => setDraftPersona(e.target.value as PersonaId)}
              className={smallSelect}
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          ) : (
            <select
              id="box-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              className={smallSelect}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          )}
        </div>
      }
      bodyClassName="gap-5 overflow-y-auto"
    >
      <div className="tab:hidden">
        <SegmentedToggle label="Session mode (mobile)" options={MODE_OPTIONS} value={draftMode} onChange={setDraftMode} />
      </div>
      <div>
        <p className="text-[30px] font-bold leading-tight tab:text-[36px]">Hi, {name || "there"}.</p>
        <p className="mt-1 text-[15px] text-text-2">
          {draftMode === "explain" ? "What do you want to teach today?" : "Which topic should I write a flawed explanation of?"}
        </p>
      </div>

      <form onSubmit={begin} className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <label htmlFor="box-topic" className="sr-only">Topic</label>
          <input
            id="box-topic"
            value={currentTopic}
            onChange={(e) => {
              setCurrentTopic(e.target.value);
              setError("");
            }}
            maxLength={120}
            placeholder="Type a topic to teach"
            className="h-12 min-w-[220px] flex-[2] rounded-[12px] border border-line bg-card-2 px-4 text-[15px] text-text placeholder:text-text-3 hover:border-text-3"
          />
          <label htmlFor="box-notes" className="sr-only">Use notes</label>
          <select
            id="box-notes"
            value={noteId}
            onChange={(e) => setNoteId(e.target.value)}
            className="h-12 min-w-[150px] flex-1 rounded-[12px] border border-line bg-card-2 px-3 text-[13px] font-semibold text-text hover:border-text-3"
          >
            <option value="">No notes</option>
            {notes.map((n) => (
              <option key={n.id} value={n.id}>Use notes: {n.title}</option>
            ))}
          </select>
          <Button type="submit" className="h-12 px-6 text-[15px]">Begin session</Button>
        </div>
        {error && <p role="alert" className="text-[13px] text-missing">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-text-2">Try</span>
          {SUGGESTED.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setCurrentTopic(t);
                setError("");
              }}
              className="h-7 rounded-full border border-line bg-card-2 px-3 text-[12px] font-semibold text-text-2 transition-colors duration-150 hover:border-text-3 hover:text-text"
            >
              {t}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-text-2">
          How this works: you explain, the learner asks one question at a time, and FeynLearn maps which ideas
          you have solid, shaky or missing.
        </p>
      </form>

      {resumeHref && unfinishedTopic && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-card-2 px-4 py-3">
          <p className="min-w-0 text-[13px]">
            <span className="text-text-2">Unfinished: </span>
            <span className="font-semibold">{unfinishedTopic.name}</span>
          </p>
          <Link href={resumeHref} className="text-[13px] font-semibold">Resume last session</Link>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 tab:grid-cols-2">
        <div className="flex min-h-0 flex-col rounded-[12px] border border-line bg-card-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] font-semibold text-text-2">Last session</p>
            {lastTopic?.sample && <SampleChip />}
          </div>
          {last && lastTopic ? (
            <>
              <p className="mt-2 font-semibold">{lastTopic.name}</p>
              <p className="tnum mt-1 text-[40px] font-bold leading-none text-lime">
                {last.score ?? "-"}
                <span className="ml-1 text-[13px] font-semibold text-text-2">understanding</span>
              </p>
              {last.summary && <p className="mt-2 line-clamp-3 text-[13px] text-text-2">{last.summary}</p>}
              <Link href={`/gap-map?topic=${encodeURIComponent(lastTopic.id)}`} className="mt-auto pt-2 text-[13px] font-semibold">
                Open gap map
              </Link>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-text-2">Finish a session to see its summary here.</p>
          )}
        </div>

        <div className="flex min-h-0 flex-col rounded-[12px] border border-line bg-card-2 p-4">
          <p className="text-[13px] font-semibold text-text-2">Recent topics</p>
          <ul className="mt-2 flex min-h-0 flex-col overflow-y-auto">
            {recent.map(({ topic, score }) => (
              <li key={topic.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setCurrentTopic(topic.name)}
                  className="min-w-0 truncate text-left text-[13px] font-semibold text-text hover:text-lime"
                  title="Use this topic"
                >
                  {topic.name}
                </button>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tnum text-[13px] font-bold">{score ?? "-"}</span>
                  <Chip>{relativeDay(topic.nextReview, now)}</Chip>
                </span>
              </li>
            ))}
            {recent.length === 0 && <li className="text-[13px] text-text-2">No topics yet.</li>}
          </ul>
        </div>
      </div>
    </Box>
  );
}
