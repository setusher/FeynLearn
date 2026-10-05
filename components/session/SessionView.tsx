"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MODE_OPTIONS } from "@/components/dashboard/StartSession";
import { Button } from "@/components/ui/Button";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import type { PersonaId } from "@/lib/personas";
import { endSession } from "@/lib/sessions";
import { useUI } from "@/lib/store";
import type { Mode } from "@/lib/types";
import { ExplainChat, type ProgressInfo } from "./ExplainChat";
import { SessionHeader } from "./SessionHeader";

type Props = { topic: string; mode: Mode; persona: PersonaId; sid?: string; focus?: string };

/** Keep the URL in step with the session without re-rendering the server page. */
function syncUrl(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  window.history.replaceState(null, "", `/session?${qs.toString()}`);
}

export function SessionView(props: Props) {
  const { topic, focus } = props;
  const setCurrentTopic = useUI((s) => s.setCurrentTopic);
  const [mode, setMode] = useState<Mode>(props.mode);
  const [persona, setPersona] = useState<PersonaId>(props.persona);
  const [sid, setSid] = useState<string | undefined>(props.sid);
  const [run, setRun] = useState(0);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const progress = useRef<ProgressInfo>({ sessionId: null, inProgress: false });

  useEffect(() => {
    setCurrentTopic(topic);
  }, [setCurrentTopic, topic]);

  const onProgress = useCallback((info: ProgressInfo) => {
    progress.current = info;
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setSid(undefined);
    setRun((r) => r + 1);
    setPendingMode(null);
    syncUrl({ topic, mode: next, persona: next === "explain" ? persona : undefined, focus });
  }

  function requestMode(next: Mode) {
    if (next === mode) return;
    if (progress.current.inProgress) setPendingMode(next);
    else switchMode(next);
  }

  async function confirmSwitch() {
    if (!pendingMode) return;
    if (progress.current.sessionId) await endSession(progress.current.sessionId);
    switchMode(pendingMode);
  }

  const toggle = <SegmentedToggle label="Session mode" options={MODE_OPTIONS} value={pendingMode ?? mode} onChange={requestMode} />;

  const banner = pendingMode && (
    <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 border border-line bg-surface px-4 py-3 text-sm">
      <span>Switching modes starts a fresh session. Your conversation so far is kept as an unfinished session.</span>
      <Button onClick={confirmSwitch}>Switch mode</Button>
      <Button variant="secondary" onClick={() => setPendingMode(null)}>Stay here</Button>
    </div>
  );

  if (mode === "reverse") {
    return (
      <div className="max-w-[720px]">
        <SessionHeader topic={topic} toggle={toggle} />
        <p className="text-ink-2">
          In this mode you read a short explanation with planted mistakes and try to catch them.
          It arrives in build phase 4.
        </p>
      </div>
    );
  }

  return (
    <ExplainChat
      key={run}
      topic={topic}
      persona={persona}
      sid={sid}
      focus={focus}
      toggle={toggle}
      banner={banner}
      onPersonaChange={(p) => {
        setPersona(p);
        syncUrl({ topic, mode, persona: p, focus });
      }}
      onSessionCreated={(id) => syncUrl({ topic, mode, persona, focus, sid: id })}
      onProgress={onProgress}
    />
  );
}
