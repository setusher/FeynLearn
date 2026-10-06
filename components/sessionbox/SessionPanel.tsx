"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DashData } from "@/components/bento/types";
import { NotesInUse } from "@/components/session/NotesInUse";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { Working } from "@/components/ui/Working";
import { PERSONAS, personaLabel, type PersonaId } from "@/lib/personas";
import { DIFFICULTIES } from "@/lib/schemas";
import { clearActive, patchActive, setActive, useSettings } from "@/lib/settings";
import { useUI } from "@/lib/store";
import type { ActiveSession, Difficulty, Mode } from "@/lib/types";
import { useExplain } from "@/lib/useExplain";
import { useReverse } from "@/lib/useReverse";
import { CatchReveal } from "./CatchReveal";
import { CatchView } from "./CatchView";
import { ChatResult } from "./ChatResult";
import { ChatView } from "./ChatView";
import { StartForm } from "./StartForm";

const MODES: { value: Mode; label: string }[] = [
  { value: "explain", label: "Explain" },
  { value: "reverse", label: "Catch the mistake" },
];

const smallSelect =
  "h-8 rounded-[10px] border border-line bg-card-2 px-2 text-[12px] font-semibold text-text hover:border-text-3";

const cap = (d: string) => d[0].toUpperCase() + d.slice(1);

type Shell = { id: string; href?: string; className: string };

function PersonaSelect({ value, onChange }: { value: PersonaId; onChange: (p: PersonaId) => void }) {
  return (
    <>
      <label htmlFor="sb-persona" className="sr-only">Explain it to</label>
      <select id="sb-persona" value={value} onChange={(e) => onChange(e.target.value as PersonaId)} className={smallSelect}>
        {PERSONAS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>
    </>
  );
}

function DifficultySelect({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <>
      <label htmlFor="sb-difficulty" className="sr-only">Difficulty</label>
      <select id="sb-difficulty" value={value} onChange={(e) => onChange(e.target.value as Difficulty)} className={smallSelect}>
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>{cap(d)}</option>
        ))}
      </select>
    </>
  );
}

function Banner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex shrink-0 flex-wrap items-center gap-2 rounded-[12px] border border-line bg-card-2 px-3 py-2.5 text-[13px]">
      {children}
    </div>
  );
}

/** Mode toggle that asks before leaving a session in progress. */
function useModeSwitch(active: ActiveSession | undefined, inProgress: boolean) {
  const { draftPersona, draftDifficulty, setDraftMode } = useUI();
  const [pending, setPending] = useState<Mode | null>(null);

  async function go(mode: Mode) {
    setPending(null);
    setDraftMode(mode);
    if (!active) return;
    await setActive(
      mode === "explain"
        ? { mode, topic: active.topic, persona: draftPersona, view: "chat" }
        : { mode, topic: active.topic, difficulty: draftDifficulty },
    );
  }

  function request(mode: Mode) {
    if (active && mode === active.mode) return;
    if (inProgress) setPending(mode);
    else void go(mode);
  }

  const banner = pending && (
    <Banner>
      <span>Switch to {pending === "explain" ? "Explain" : "Catch the mistake"}? The current session is kept as unfinished.</span>
      <Button className="h-8" onClick={() => void go(pending)}>Switch</Button>
      <Button variant="secondary" className="h-8" onClick={() => setPending(null)}>Stay</Button>
    </Banner>
  );
  return { request, pending, banner };
}

function TopicLine({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-text-2">{children}</div>;
}

function IdleBox({ shell, data, name }: { shell: Shell; data: DashData; name?: string }) {
  const { draftMode, setDraftMode, draftPersona, setDraftPersona, draftDifficulty, setDraftDifficulty } = useUI();
  return (
    <Box
      {...shell}
      title="Session"
      extra={
        <>
          <SegmentedToggle label="Session mode" options={MODES} value={draftMode} onChange={setDraftMode} />
          {draftMode === "explain" ? (
            <PersonaSelect value={draftPersona} onChange={setDraftPersona} />
          ) : (
            <DifficultySelect value={draftDifficulty} onChange={setDraftDifficulty} />
          )}
        </>
      }
    >
      <StartForm data={data} name={name} />
    </Box>
  );
}

function ExplainBox({ shell, active }: { shell: Shell; active: ActiveSession }) {
  const chat = useExplain(active);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const analyzed = Boolean(chat.session?.concepts?.length) && (active.view === "result" || Boolean(chat.session?.endedAt));
  const modes = useModeSwitch(active, chat.started && !analyzed);

  let extra: ReactNode;
  if (analyzed) {
    extra = (
      <>
        <SegmentedToggle label="Session mode" options={MODES} value={modes.pending ?? "explain"} onChange={modes.request} />
        <Button className="h-8 px-3 text-[12px]" onClick={() => void clearActive()}>New session</Button>
      </>
    );
  } else {
    extra = (
      <>
        <SegmentedToggle label="Session mode" options={MODES} value={modes.pending ?? "explain"} onChange={modes.request} />
        {chat.started ? (
          <Chip>{personaLabel(chat.persona)}</Chip>
        ) : (
          <PersonaSelect value={chat.persona} onChange={(p) => void patchActive({ persona: p })} />
        )}
        <Button
          className="h-8 px-3 text-[12px]"
          disabled={!chat.session || chat.pending !== null || chat.analyzing}
          onClick={() => void chat.analyze()}
        >
          {chat.analyzing ? "Analyzing..." : "End and analyze"}
        </Button>
        <Button variant="secondary" className="h-8 px-3 text-[12px]" onClick={() => (chat.started ? setConfirmDiscard(true) : void chat.discard())}>
          {chat.started ? "Discard" : "Cancel"}
        </Button>
      </>
    );
  }

  return (
    <Box {...shell} title="Session" extra={extra} bodyClassName="gap-3">
      <TopicLine>
        <span className="text-[15px] font-semibold text-text">{active.topic}</span>
        {!analyzed && <span>explaining to a {personaLabel(chat.persona).toLowerCase()}</span>}
        {active.focus && <Chip>Focus: {active.focus}</Chip>}
        {active.angle === "analogy" && <Chip>Angle: analogy</Chip>}
        <NotesInUse topic={active.topic} />
        {!analyzed && chat.readAloud.supported && (
          <label className="inline-flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={chat.readAloud.enabled}
              onChange={(e) => chat.readAloud.setEnabled(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--lime)]"
            />
            Read replies aloud
          </label>
        )}
      </TopicLine>
      {modes.banner}
      {confirmDiscard && (
        <Banner>
          <span>Delete this conversation? It will not count toward your progress.</span>
          <Button className="h-8" onClick={() => void chat.discard()}>Discard</Button>
          <Button variant="secondary" className="h-8" onClick={() => setConfirmDiscard(false)}>Keep it</Button>
        </Banner>
      )}
      {chat.loading ? (
        <Working />
      ) : analyzed && chat.session ? (
        <ChatResult session={chat.session} onNew={() => void clearActive()} />
      ) : (
        <ChatView chat={chat} />
      )}
    </Box>
  );
}

function CatchBox({ shell, active }: { shell: Shell; active: ActiveSession }) {
  const catcher = useReverse(active);
  const modes = useModeSwitch(active, Boolean(catcher.session) && !catcher.revealed);
  const started = useRef(false);

  // Begin session in this mode: write the explanation straight away. The ref makes
  // this run once per box, even though `catcher` changes on every render.
  useEffect(() => {
    if (active.sessionId || started.current) return;
    started.current = true;
    window.setTimeout(() => void catcher.generate(), 0);
  }, [active.sessionId, catcher]);

  return (
    <Box
      {...shell}
      title="Session"
      bodyClassName="gap-3"
      extra={
        <>
          <SegmentedToggle label="Session mode" options={MODES} value={modes.pending ?? "reverse"} onChange={modes.request} />
          <Chip>{cap(catcher.difficulty)}</Chip>
          <Button variant="secondary" className="h-8 px-3 text-[12px]" onClick={() => void catcher.discard()}>
            {catcher.revealed ? "New session" : "End"}
          </Button>
        </>
      }
    >
      <TopicLine>
        <span className="text-[15px] font-semibold text-text">{active.topic}</span>
        <span>catch the mistake</span>
        <NotesInUse topic={active.topic} />
      </TopicLine>
      {modes.banner}
      {catcher.error && (
        <div role="alert" className="shrink-0 rounded-[12px] border border-line border-l-[3px] border-l-missing bg-tint-missing px-3 py-2.5 text-[13px]">
          <p>{catcher.error.message}</p>
          <button type="button" onClick={catcher.error.retry} className="mt-1 font-semibold text-lime underline underline-offset-2">
            Try again
          </button>
        </div>
      )}
      {catcher.loading || catcher.busy === "generating" ? (
        <Working label="Writing an explanation with planted mistakes..." />
      ) : catcher.revealed && catcher.result ? (
        <CatchReveal result={catcher.result} topicId={catcher.session?.topicId} onAgain={() => void catcher.generate()} />
      ) : catcher.result ? (
        <CatchView catcher={catcher} />
      ) : null}
    </Box>
  );
}

/**
 * The Session box. Used on the dashboard (area "a") and on /session. The active
 * session lives in settings, so both places show the same session and a refresh
 * comes back to it.
 */
export function SessionPanel({ data, shell }: { data: DashData; shell: Shell }) {
  const settings = useSettings();
  if (!settings) return <Box {...shell} title="Session"><Working /></Box>;
  const active = settings.active;
  if (!active) return <IdleBox shell={shell} data={data} name={settings.name} />;
  const key = `${active.mode}-${active.startedAt}`;
  return active.mode === "explain" ? (
    <ExplainBox key={key} shell={shell} active={active} />
  ) : (
    <CatchBox key={key} shell={shell} active={active} />
  );
}
