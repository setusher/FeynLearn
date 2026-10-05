import type { Message, Misconception } from "@/lib/types";

export function MisconceptionCallout({ misconception }: { misconception: Misconception }) {
  return (
    <aside className="mt-3 border-l-[3px] border-shaky bg-tint-shaky px-4 py-3 text-[15px]">
      <p className="text-xs font-semibold uppercase tracking-wide text-shaky">Common misconception</p>
      <p className="mt-1">
        <span className="font-medium">{misconception.name}.</span> {misconception.correction}
      </p>
    </aside>
  );
}

function Turn({ role, text, misconception }: Message) {
  return (
    <li className="border-b border-line py-4 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-2">
        {role === "user" ? "You" : "Learner"}
      </p>
      <p className="mt-1 whitespace-pre-wrap">{text}</p>
      {misconception && <MisconceptionCallout misconception={misconception} />}
    </li>
  );
}

/** A written-dialogue transcript: labels above each message, hairlines between turns. */
export function Transcript({
  messages,
  pending,
  waiting,
}: {
  messages: Message[];
  pending?: string | null;
  waiting?: boolean;
}) {
  return (
    <div aria-live="polite" aria-relevant="additions">
      <ol className="flex flex-col">
        {messages.map((m, i) => (
          <Turn key={i} {...m} />
        ))}
        {pending && <Turn role="user" text={pending} />}
      </ol>
      {waiting && (
        <p className="py-4 text-sm text-ink-2" role="status">
          The learner is thinking...
        </p>
      )}
    </div>
  );
}
