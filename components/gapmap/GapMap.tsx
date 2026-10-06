"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { StatusMark } from "@/components/ui/Chip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Working } from "@/components/ui/Working";
import { formatDate } from "@/lib/format";
import { STATUS_LABEL, applyReverseEvidence, findPrevious, reverseEvidence } from "@/lib/graph";
import { useAllData } from "@/lib/hooks";
import { isPersonaId } from "@/lib/personas";
import { useUI } from "@/lib/store";
import type { Concept, Session } from "@/lib/types";
import { DetailBox } from "./DetailBox";
import { SummaryBox } from "./SummaryBox";

// React Flow measures the DOM, so render it on the client only.
const ConceptGraph = dynamic(() => import("./ConceptGraph"), {
  ssr: false,
  loading: () => <Working label="Drawing map..." />,
});

type View = "previous" | "current";

const VERDICT_TEXT: Record<string, string> = {
  caught: "Caught",
  partly: "Partly caught",
  missed: "Missed",
  none: "-",
};

const isAnalyzed = (s: Session) => s.mode === "explain" && (s.concepts?.length ?? 0) > 0;
const when = (s: Session) => s.endedAt ?? s.startedAt;

/** Text shown on a node when its status changed since the previous attempt. */
function changeText(concept: Concept, previous: Concept[] | undefined): string | undefined {
  if (!previous) return undefined;
  const before = findPrevious(concept, previous);
  if (!before) return "new";
  if (before.status === concept.status) return undefined;
  return `was ${STATUS_LABEL[before.status].toLowerCase()}`;
}

export function GapMap({ topicParam, sessionParam }: { topicParam?: string; sessionParam?: string }) {
  const data = useAllData();
  const router = useRouter();
  const setCurrentTopic = useUI((s) => s.setCurrentTopic);
  const [view, setView] = useState<View>("current");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const analyzedTopics = useMemo(() => {
    if (!data) return [];
    const withMaps = new Set(data.sessions.filter(isAnalyzed).map((s) => s.topicId));
    return data.topics.filter((t) => withMaps.has(t.id)).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const latestTopicId = useMemo(() => {
    const latest = data?.sessions.filter(isAnalyzed).sort((a, b) => when(b) - when(a))[0];
    return latest?.topicId;
  }, [data]);

  const topicId = analyzedTopics.some((t) => t.id === topicParam) ? topicParam : latestTopicId;
  const topic = data?.topics.find((t) => t.id === topicId);

  useEffect(() => {
    if (topic) setCurrentTopic(topic.name);
  }, [topic, setCurrentTopic]);

  if (!data) return <Working />;

  if (!topic) {
    return (
      <Box id="gap-empty" title="Gap map" bodyClassName="gap-3">
        <h1 className="sr-only">Gap map</h1>
        <p className="max-w-[640px] text-[15px] text-text-2">
          No maps yet. Finish an Explain session and choose End and analyze to see which ideas are solid, shaky or missing.
        </p>
        <Link href="/session" className={buttonClass("primary", "self-start")}>Start a session</Link>
      </Box>
    );
  }

  const attempts = data.sessions
    .filter((s) => s.topicId === topic.id && isAnalyzed(s))
    .sort((a, b) => when(a) - when(b));
  const currentIdx = Math.max(
    0,
    sessionParam && attempts.some((s) => s.id === sessionParam)
      ? attempts.findIndex((s) => s.id === sessionParam)
      : attempts.length - 1,
  );
  const current = attempts[currentIdx];
  const previous = currentIdx > 0 ? attempts[currentIdx - 1] : undefined;
  const shown = view === "previous" && previous ? previous : current;
  const compareTo = shown === current ? previous?.concepts : undefined;

  // Catch-the-mistake results after this attempt nudge statuses (see lib/graph.ts).
  const evidence = reverseEvidence(data.sessions.filter((s) => s.topicId === topic.id));
  const { concepts, notes } =
    shown === current
      ? applyReverseEvidence(shown.concepts ?? [], evidence, when(shown))
      : { concepts: shown.concepts ?? [], notes: {} as Record<string, string> };

  const changes = Object.fromEntries(
    concepts.map((c) => {
      const parts = [changeText(c, compareTo), notes[c.id]].filter(Boolean);
      return [c.id, parts.length ? parts.join("; ") : undefined];
    }),
  );
  const checksFor = (id: string) => evidence.filter((e) => e.conceptId === id);
  const selected = concepts.find((c) => c.id === selectedId);
  const isNew = sessionParam === current.id && shown === current;

  const practiceHref = (label: string) => {
    const persona = isPersonaId(current.persona) ? current.persona : "child";
    const qs = new URLSearchParams({ topic: topic.name, mode: "explain", persona, focus: label });
    return `/session?${qs.toString()}`;
  };

  const smallSelect =
    "h-8 max-w-[220px] rounded-[10px] border border-line bg-card-2 px-2 text-[12px] font-semibold text-text hover:border-text-3";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Gap map</h1>
      <div className="grid gap-4 desk:h-[calc(100vh-121px)] desk:min-h-[680px] desk:grid-cols-12 desk:grid-rows-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Box
          id="graph"
          title="Gap map"
          className="min-h-[520px] desk:col-span-8 desk:row-span-2 desk:min-h-0"
          extra={
            <>
              <label htmlFor="gap-topic" className="sr-only">Topic</label>
              <select
                id="gap-topic"
                value={topic.id}
                className={smallSelect}
                onChange={(e) => {
                  setSelectedId(null);
                  setView("current");
                  router.replace(`/gap-map?topic=${encodeURIComponent(e.target.value)}`);
                }}
              >
                {analyzedTopics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {previous && (
                <SegmentedToggle
                  label="Attempt to show"
                  options={[
                    { value: "previous", label: `Previous (${formatDate(when(previous))})` },
                    { value: "current", label: `Latest (${formatDate(when(current))})` },
                  ]}
                  value={view}
                  onChange={(v) => {
                    setView(v);
                    setSelectedId(null);
                  }}
                />
              )}
            </>
          }
        >
          <ConceptGraph concepts={concepts} changes={changes} selectedId={selectedId} onSelect={setSelectedId} />
        </Box>
        <DetailBox
          className="min-h-[300px] desk:col-span-4 desk:min-h-0"
          concept={selected}
          concepts={concepts}
          change={selected ? changes[selected.id] : undefined}
          checks={selected ? checksFor(selected.id) : []}
          practiceHref={practiceHref}
          onSelect={setSelectedId}
        />
        <SummaryBox
          className="min-h-[280px] desk:col-span-4 desk:min-h-0"
          session={shown}
          concepts={concepts}
          sample={topic.sample}
          isNew={isNew}
        />
      </div>

      <Box id="concept-list" title="All concepts">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[13px] text-text-2">
                <th scope="col" className="py-2 pr-4 font-semibold">Concept</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                {compareTo && <th scope="col" className="py-2 pr-4 font-semibold">Change</th>}
                {evidence.length > 0 && <th scope="col" className="py-2 font-semibold">Catch the mistake</th>}
              </tr>
            </thead>
            <tbody>
              {concepts.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-b-0">
                  <td className="py-2.5 pr-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={c.id === selectedId}
                      className="text-left font-semibold text-text underline-offset-2 hover:text-lime hover:underline"
                    >
                      {c.label}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4"><StatusMark status={c.status} /></td>
                  {compareTo && <td className="py-2.5 pr-4 text-text-2">{changeText(c, compareTo) ?? "no change"}</td>}
                  {evidence.length > 0 && (
                    <td className="py-2.5 text-text-2">{VERDICT_TEXT[checksFor(c.id)[0]?.verdict ?? "none"]}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Box>
    </div>
  );
}
