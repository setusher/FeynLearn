"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Working } from "@/components/ui/Working";
import { useAllData, useNow } from "@/lib/hooks";
import { isPersonaId } from "@/lib/personas";
import { DIFFICULTIES } from "@/lib/schemas";
import { setActive, useSettings } from "@/lib/settings";
import type { Difficulty } from "@/lib/types";
import { SessionPanel } from "./SessionPanel";
import { ConceptsSoFarBox, MisconceptionLogBox, TimerBox, TipsBox } from "./SideBoxes";

export type SessionParams = {
  topic?: string;
  mode?: string;
  persona?: string;
  difficulty?: string;
  focus?: string;
  angle?: string;
  sid?: string;
};

/**
 * /session: the Session box at full size with a column of helper boxes. Links
 * from elsewhere (Revisit, Gap map "Practice this concept") pass the session in
 * the URL; it becomes the active session and the URL is cleaned up.
 */
export function SessionRoute({ params }: { params: SessionParams }) {
  const router = useRouter();
  const data = useAllData();
  const now = useNow();
  const settings = useSettings();
  const applied = useRef(false);
  const [ready, setReady] = useState(!params.topic);

  useEffect(() => {
    if (applied.current || !params.topic) return;
    applied.current = true;
    const mode = params.mode === "reverse" ? "reverse" : "explain";
    const difficulty = DIFFICULTIES.includes(params.difficulty as Difficulty) ? (params.difficulty as Difficulty) : undefined;
    void setActive({
      mode,
      topic: params.topic,
      persona: mode === "explain" ? (isPersonaId(params.persona) ? params.persona : "child") : undefined,
      difficulty: mode === "reverse" ? difficulty ?? "moderate" : undefined,
      focus: params.focus,
      angle: params.angle === "analogy" ? "analogy" : undefined,
      sessionId: params.sid,
      view: "chat",
    }).then(() => {
      setReady(true);
      router.replace("/session");
    });
  }, [params, router]);

  if (!data || now === 0 || !settings || !ready) return <Working />;
  const d = { ...data, now };
  const active = settings.active;

  return (
    <div className="grid gap-4 desk:h-[calc(100vh-121px)] desk:min-h-[640px] desk:grid-cols-12 desk:grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <h1 className="sr-only">Session</h1>
      <SessionPanel data={d} shell={{ id: "session", className: "min-h-[600px] desk:col-span-8 desk:row-span-4 desk:min-h-0" }} />
      <div className="desk:col-span-4">
        <TimerBox data={d} active={active} />
      </div>
      <div className="min-h-[220px] desk:col-span-4 desk:min-h-0 [&>section]:h-full">
        <ConceptsSoFarBox data={d} active={active} />
      </div>
      <div className="min-h-[200px] desk:col-span-4 desk:min-h-0 [&>section]:h-full">
        <MisconceptionLogBox data={d} active={active} />
      </div>
      <div className="desk:col-span-4">
        <TipsBox active={active} />
      </div>
    </div>
  );
}
