"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Field";
import { PageHeader, StatusLine } from "@/components/ui/PageHeader";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { formatDate } from "@/lib/format";
import { STATUS_LABEL, findPrevious } from "@/lib/graph";
import { useAllData } from "@/lib/hooks";
import { isPersonaId } from "@/lib/personas";
import { useUI } from "@/lib/store";
import type { Concept, Session } from "@/lib/types";
import { AttemptSummary } from "./AttemptSummary";
import { ConceptDetail } from "./ConceptDetail";

// React Flow measures the DOM, so render it on the client only.
const ConceptGraph = dynamic(() => import("./ConceptGraph"), {
  ssr: false,
  loading: () => <StatusLine>Loading map...</StatusLine>,
});

type View = "previous" | "current";

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

  if (!data) return <StatusLine>Loading...</StatusLine>;

  if (!topic) {
    return (
      <div className="max-w-[960px]">
        <PageHeader title="Gap map" />
        <p className="max-w-[640px] text-ink-2">
          No maps yet. Finish an Explain session and choose &ldquo;End session and analyze&rdquo; to
          see which ideas are solid, shaky or missing.
        </p>
        <Link href="/" className={buttonClass("secondary", "mt-4")}>Start a session</Link>
      </div>
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
  const concepts = shown.concepts ?? [];
  const compareTo = shown === current ? previous?.concepts : undefined;

  const changes = Object.fromEntries(concepts.map((c) => [c.id, changeText(c, compareTo)]));
  const selected = concepts.find((c) => c.id === selectedId);
  const isNew = sessionParam === current.id && shown === current;

  const practiceHref = (label: string) => {
    const persona = isPersonaId(current.persona) ? current.persona : "child";
    const qs = new URLSearchParams({ topic: topic.name, mode: "explain", persona, focus: label });
    return `/session?${qs.toString()}`;
  };

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        title="Gap map"
        intro="Each box is an idea a full explanation needs. Click one to see what you said about it."
      />

      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="min-w-[260px]">
          <Label htmlFor="gap-topic">Topic</Label>
          <Select
            id="gap-topic"
            value={topic.id}
            onChange={(e) => {
              setSelectedId(null);
              setView("current");
              router.replace(`/gap-map?topic=${encodeURIComponent(e.target.value)}`);
            }}
          >
            {analyzedTopics.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
        {previous && (
          <div>
            <span className="mb-1 block text-sm font-medium text-ink-2">Compare</span>
            <SegmentedToggle
              label="Attempt to show"
              options={[
                { value: "previous", label: `Previous attempt (${formatDate(when(previous))})` },
                { value: "current", label: `This attempt (${formatDate(when(current))})` },
              ]}
              value={view}
              onChange={(v) => {
                setView(v);
                setSelectedId(null);
              }}
            />
          </div>
        )}
      </div>

      <AttemptSummary session={shown} isNew={isNew} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <ConceptGraph concepts={concepts} changes={changes} selectedId={selectedId} onSelect={setSelectedId} />
        <ConceptDetail concept={selected} change={selected ? changes[selected.id] : undefined} practiceHref={practiceHref} />
      </div>

      <section aria-labelledby="concept-list" className="mt-10">
        <h2 id="concept-list" className="mb-3 text-xl">All concepts</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[15px]">
            <thead>
              <tr className="border-b border-line text-sm text-ink-2">
                <th scope="col" className="py-2 pr-4 font-medium">Concept</th>
                <th scope="col" className="py-2 pr-4 font-medium">Status</th>
                {compareTo && <th scope="col" className="py-2 font-medium">Change</th>}
              </tr>
            </thead>
            <tbody>
              {concepts.map((c) => (
                <tr key={c.id} className="border-b border-line">
                  <td className="py-2.5 pr-4">
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={c.id === selectedId}
                      className="text-left text-ink underline-offset-2 hover:underline"
                    >
                      {c.label}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4">{STATUS_LABEL[c.status]}</td>
                  {compareTo && <td className="py-2.5 text-ink-2">{changes[c.id] ?? "no change"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
