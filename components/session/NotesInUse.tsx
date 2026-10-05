"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { linkedNoteTitle } from "@/lib/noteStore";

/** "Using your notes: <title>" line in a session header, or nothing. */
export function NotesInUse({ topic }: { topic: string }) {
  const title = useLiveQuery(() => linkedNoteTitle(topic), [topic]);
  if (!title) return null;
  return (
    <span>
      Using your notes: <Link href={`/notes?topic=${encodeURIComponent(topic)}`} className="underline underline-offset-2">{title}</Link>
    </span>
  );
}
