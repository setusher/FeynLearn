"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Working } from "@/components/ui/Working";
import type { ReverseState } from "@/lib/useReverse";

function FlagEditor({
  initial,
  onSave,
  onRemove,
  onCancel,
}: {
  initial?: string;
  onSave: (reason: string) => void;
  onRemove?: () => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState(initial ?? "");
  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(reason.trim());
      }}
    >
      <label htmlFor="flag-reason" className="text-[13px] font-semibold">What&apos;s wrong with this?</label>
      <textarea
        id="flag-reason"
        autoFocus
        rows={3}
        maxLength={1000}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Say what is incorrect and what the right fact is."
        className="rounded-[12px] border border-line bg-card px-3 py-2 text-[14px] text-text placeholder:text-text-3 focus:border-lime"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="h-9">{initial !== undefined ? "Update flag" : "Submit flag"}</Button>
        {onRemove && <Button variant="secondary" className="h-9" onClick={onRemove}>Remove flag</Button>}
        <Button variant="secondary" className="h-9" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

/** Numbered paragraphs; selecting one opens an inline flag field under it. */
export function CatchView({ catcher }: { catcher: ReverseState }) {
  const [selected, setSelected] = useState<number | null>(null);
  const result = catcher.result;
  if (!result) return null;
  const flagFor = (i: number) => result.flags.find((f) => f.index === i);
  const judging = catcher.busy === "judging";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <p className="shrink-0 text-[13px] text-text-2">
        One to three of these paragraphs contain a planted mistake. Select a paragraph to flag it.
      </p>
      <ol className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {result.paragraphs.map((p, i) => {
          const flag = flagFor(i);
          const open = selected === i;
          return (
            <li
              key={i}
              className={`rounded-[12px] border bg-card-2 transition-colors duration-150 ${
                open ? "border-lime" : flag ? "border-shaky" : "border-line hover:border-text-3"
              }`}
            >
              <button
                type="button"
                disabled={judging}
                aria-expanded={open}
                onClick={() => setSelected(open ? null : i)}
                className="flex w-full gap-3 px-3.5 py-3 text-left"
              >
                <span className="tnum w-5 shrink-0 text-[14px] font-bold text-lime">{i + 1}</span>
                <span className="flex-1 text-[14px] leading-relaxed">{p.text}</span>
                {flag && !open && <Chip className="self-start border-shaky text-shaky">Flagged</Chip>}
              </button>
              {flag && !open && (
                <p className="border-t border-line px-3.5 py-2 text-[13px] text-text-2">
                  <span className="font-semibold text-text">Your reason:</span> {flag.reason || "no reason given"}
                </p>
              )}
              {open && (
                <div className="border-t border-line px-3.5 pb-3">
                  <FlagEditor
                    key={i}
                    initial={flag?.reason}
                    onSave={async (reason) => {
                      await catcher.setFlag(i, reason);
                      setSelected(null);
                    }}
                    onRemove={
                      flag
                        ? async () => {
                            await catcher.setFlag(i, null);
                            setSelected(null);
                          }
                        : undefined
                    }
                    onCancel={() => setSelected(null)}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-line pt-3">
        {judging ? (
          <Working label="Checking your flags..." />
        ) : (
          <>
            <Button onClick={() => void catcher.reveal()}>Finish and reveal</Button>
            <span className="tnum text-[13px] text-text-2">
              {result.flags.length} {result.flags.length === 1 ? "paragraph" : "paragraphs"} flagged
            </span>
            <Button variant="secondary" className="ml-auto h-9" onClick={() => void catcher.generate()} disabled={catcher.busy !== null}>
              New explanation
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
