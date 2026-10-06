"use client";

import { useEffect, useRef } from "react";
import { Composer } from "@/components/session/Composer";
import { Working } from "@/components/ui/Working";
import { SOFT_TURN_LIMIT, type ExplainState } from "@/lib/useExplain";
import type { Message, Misconception } from "@/lib/types";

export function MisconceptionCallout({ misconception }: { misconception: Misconception }) {
  return (
    <div role="note" className="mt-2 rounded-[12px] border border-line border-l-[3px] border-l-shaky bg-tint-shaky px-3 py-2.5 text-[14px]">
      <p className="text-[11px] font-bold uppercase tracking-wide text-shaky">Common misconception</p>
      <p className="mt-0.5">
        <span className="font-semibold">{misconception.name}.</span> {misconception.correction}
      </p>
    </div>
  );
}

function Bubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <li className="flex justify-end">
        <div className="max-w-[85%] rounded-[12px] border border-lime px-3.5 py-2.5 text-[15px]">
          <p className="sr-only">You:</p>
          <p className="whitespace-pre-wrap">{message.text}</p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="rounded-[12px] bg-card-2 px-3.5 py-2.5 text-[15px]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-text-2">Learner</p>
          <p className="mt-0.5 whitespace-pre-wrap">{message.text}</p>
        </div>
        {message.misconception && <MisconceptionCallout misconception={message.misconception} />}
      </div>
    </li>
  );
}

/** Transcript that scrolls inside the box, with the composer docked at the bottom. */
export function ChatView({ chat }: { chat: ExplainState }) {
  const end = useRef<HTMLDivElement>(null);
  const count = chat.messages.length;

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [count, chat.pending]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1" aria-live="polite" aria-relevant="additions">
        <ol className="flex flex-col gap-3">
          {chat.messages.map((m, i) => (
            <Bubble key={i} message={m} />
          ))}
          {chat.pending && <Bubble message={{ role: "user", text: chat.pending }} />}
        </ol>
        {chat.pending && !chat.error && (
          <div className="mt-3">
            <Working label="The learner is thinking..." />
          </div>
        )}
        {chat.error && (
          <div role="alert" className="mt-3 rounded-[12px] border border-line border-l-[3px] border-l-missing bg-tint-missing px-3 py-2.5 text-[13px]">
            <p>{chat.error}</p>
            <p className="mt-1.5 flex gap-4">
              <button type="button" onClick={chat.retry} className="font-semibold text-lime underline underline-offset-2">Try again</button>
              <button type="button" onClick={chat.dropPending} className="text-text-2 underline underline-offset-2">Remove and rewrite</button>
            </p>
          </div>
        )}
        {chat.analyzeError && (
          <div role="alert" className="mt-3 rounded-[12px] border border-line border-l-[3px] border-l-missing bg-tint-missing px-3 py-2.5 text-[13px]">
            <p>Analysis failed. {chat.analyzeError}</p>
            <p className="mt-1.5 flex gap-4">
              <button type="button" onClick={() => void chat.analyze()} className="font-semibold text-lime underline underline-offset-2">Try again</button>
              <button type="button" onClick={() => void chat.endWithoutAnalysis()} className="text-text-2 underline underline-offset-2">End without analysis</button>
            </p>
          </div>
        )}
        <div ref={end} />
      </div>

      {chat.analyzing ? (
        <div className="shrink-0 border-t border-line pt-3">
          <Working label="Analyzing your explanation. This can take up to half a minute." />
        </div>
      ) : (
        <Composer
          disabled={chat.pending !== null}
          onSend={(t) => void chat.send(t)}
          hint={
            chat.userTurns >= SOFT_TURN_LIMIT
              ? "You have explained a lot. End and analyze when you are ready."
              : `Turn ${chat.userTurns + 1} of about ${SOFT_TURN_LIMIT}.`
          }
        />
      )}
    </div>
  );
}
