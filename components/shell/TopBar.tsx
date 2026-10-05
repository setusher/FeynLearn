"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useNow } from "@/lib/hooks";
import { streakDays } from "@/lib/stats";
import { useUI } from "@/lib/store";

export function TopBar() {
  const currentTopic = useUI((s) => s.currentTopic);
  const now = useNow();
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const streak = sessions && now ? streakDays(sessions, now) : 0;

  return (
    <section
      aria-label="Current topic and streak"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-line bg-surface px-4 py-3 text-sm md:px-10"
    >
      <p className="min-w-0 truncate text-ink-2">
        Topic: <span className="text-ink">{currentTopic || "None selected"}</span>
      </p>
      <p className="text-ink-2">
        Streak: <span className="tnum text-ink">{streak}</span> {streak === 1 ? "day" : "days"}
      </p>
    </section>
  );
}
