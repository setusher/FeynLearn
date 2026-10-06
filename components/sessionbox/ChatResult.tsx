"use client";

import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/Button";
import { StatusMark } from "@/components/ui/Chip";
import type { Session } from "@/lib/types";

/** Summary shown inside the Session box after an Explain session is analyzed. */
export function ChatResult({ session, onNew }: { session: Session; onNew: () => void }) {
  const concepts = session.concepts ?? [];
  const count = (s: "solid" | "shaky" | "missing") => concepts.filter((c) => c.status === s).length;
  const stat = "rounded-[12px] border border-line bg-card-2 p-3";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      <div className="grid grid-cols-3 gap-2">
        <div className={stat}>
          <p className="text-[12px] font-semibold text-text-2">Understanding</p>
          <p className="tnum mt-1 text-[40px] font-bold leading-none text-lime">{session.score ?? "-"}</p>
        </div>
        <div className={stat}>
          <p className="text-[12px] font-semibold text-text-2">Coverage</p>
          <p className="tnum mt-1 text-[40px] font-bold leading-none">{session.coverage ?? "-"}</p>
        </div>
        <div className={stat}>
          <p className="text-[12px] font-semibold text-text-2">Accuracy</p>
          <p className="tnum mt-1 text-[40px] font-bold leading-none">{session.accuracy ?? "-"}</p>
        </div>
      </div>

      {session.summary && <p className="text-[15px]">{session.summary}</p>}

      <div className={stat}>
        <p className="text-[12px] font-semibold text-text-2">Concepts found</p>
        <p className="mt-1.5 flex flex-wrap gap-4 text-[13px] font-semibold">
          <StatusMark status="solid" label={`${count("solid")} solid`} />
          <StatusMark status="shaky" label={`${count("shaky")} shaky`} />
          <StatusMark status="missing" label={`${count("missing")} missing`} />
        </p>
        <ul className="mt-2 flex flex-col gap-1 text-[13px]">
          {concepts.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <span className="w-16 shrink-0 text-text-2"><StatusMark status={c.status} /></span>
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {session.misconceptions && session.misconceptions.length > 0 && (
        <div className="rounded-[12px] border border-line border-l-[3px] border-l-shaky bg-tint-shaky px-3 py-2.5 text-[13px]">
          <p className="text-[11px] font-bold uppercase tracking-wide text-shaky">Misconceptions</p>
          <ul className="mt-1 flex flex-col gap-1">
            {session.misconceptions.map((m, i) => (
              <li key={i}>
                <span className="font-semibold">{m.name}.</span> {m.correction}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        <Link href={`/gap-map?topic=${encodeURIComponent(session.topicId)}&session=${encodeURIComponent(session.id)}`} className={buttonClass("primary")}>
          Open gap map
        </Link>
        <Button variant="secondary" onClick={onNew}>New session</Button>
      </div>
    </div>
  );
}
