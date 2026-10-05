"use client";

import { useState } from "react";
import { ErrorLine, StatusLine } from "@/components/ui/PageHeader";
import { greeting } from "@/lib/format";
import { useAllData, useNow } from "@/lib/hooks";
import { topicScore } from "@/lib/score";
import { seedSampleData } from "@/lib/seed";
import { isDue } from "@/lib/sm2";
import { overallScore, sessionsThisWeek } from "@/lib/stats";
import { DueList } from "./DueList";
import { RecentTopics, type TopicRow } from "./RecentTopics";
import { StartSession } from "./StartSession";
import { StatRow } from "./StatRow";

export function Dashboard() {
  const data = useAllData();
  const now = useNow();
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  async function loadSample() {
    setSeeding(true);
    setSeedError("");
    try {
      await seedSampleData();
    } catch {
      setSeedError("Could not load the sample topic. Your browser may be blocking local storage.");
    } finally {
      setSeeding(false);
    }
  }

  if (!data || now === 0) return <StatusLine>Loading...</StatusLine>;

  const { topics, sessions, challenges, notes } = data;
  const due = topics.filter((t) => isDue(t.nextReview, now));
  const isEmpty = topics.length === 0;

  const rows: TopicRow[] = topics
    .map((topic) => {
      const ts = sessions.filter((s) => s.topicId === topic.id);
      const lastSession = ts.sort((a, b) => b.startedAt - a.startedAt)[0];
      const score = topicScore(ts, challenges.filter((c) => c.topicId === topic.id));
      return { topic, lastSession, score };
    })
    .sort((a, b) => (b.lastSession?.startedAt ?? b.topic.createdAt) - (a.lastSession?.startedAt ?? a.topic.createdAt));

  const overall = overallScore(topics, sessions, challenges);
  const dueSentence =
    due.length === 0
      ? "Nothing is due for revisit today."
      : `You have ${due.length} ${due.length === 1 ? "topic" : "topics"} due for revisit.`;

  return (
    <div className="max-w-[960px]">
      <header className="mb-8">
        <h1 className="text-[30px]">{greeting(new Date(now))}</h1>
        <p className="mt-1 text-ink-2">{isEmpty ? "Learn a concept by teaching it." : dueSentence}</p>
      </header>

      {isEmpty && (
        <div className="mb-8 max-w-[640px] border-l-[3px] border-accent bg-surface px-5 py-4">
          <p>
            FeynLearn asks you to explain a topic to someone who knows nothing about it, then shows
            you which parts of your understanding are solid, shaky or missing. You fix the gaps,
            connect the ideas, and come back on a spaced schedule to apply them.
          </p>
          <p className="mt-3">
            <button
              type="button"
              onClick={loadSample}
              disabled={seeding}
              className="text-accent underline underline-offset-2 disabled:opacity-50"
            >
              {seeding ? "Loading sample topic..." : "Try a sample topic"}
            </button>
            <span className="text-ink-2"> (&ldquo;Why do seasons happen?&rdquo;, with some past sessions)</span>
          </p>
          {seedError && <div className="mt-3"><ErrorLine message={seedError} onRetry={loadSample} /></div>}
        </div>
      )}

      <StatRow
        stats={[
          { label: "Overall understanding", value: overall === null ? "-" : String(overall), hint: "Out of 100" },
          { label: "Sessions this week", value: String(sessionsThisWeek(sessions, now)) },
          { label: "Topics studied", value: String(topics.length) },
        ]}
      />

      <div className="mt-10">
        <StartSession hasNotes={notes.length > 0} />
      </div>

      <section aria-labelledby="recent-heading" className="mt-12">
        <h2 id="recent-heading" className="mb-3 text-xl">Recent topics</h2>
        <RecentTopics rows={rows} now={now} />
      </section>

      <section aria-labelledby="due-heading" className="mt-12">
        <h2 id="due-heading" className="mb-3 text-xl">Due for revisit</h2>
        <DueList topics={due} now={now} />
      </section>
    </div>
  );
}
