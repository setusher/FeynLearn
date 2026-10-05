"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "./db";

/** Live snapshot of all stored records. `undefined` while IndexedDB is loading. */
export function useAllData() {
  return useLiveQuery(async () => {
    const [topics, sessions, challenges, notes] = await Promise.all([
      db.topics.toArray(),
      db.sessions.toArray(),
      db.challenges.toArray(),
      db.notes.toArray(),
    ]);
    return { topics, sessions, challenges, notes };
  });
}

export function useDueCount(): number {
  const now = useNow();
  return useLiveQuery(() => db.topics.where("nextReview").belowOrEqual(now).count(), [now]) ?? 0;
}

/** Current time, refreshed every minute. Starts at 0 on the server to avoid hydration mismatch. */
export function useNow(): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
