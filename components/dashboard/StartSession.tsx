"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Select, TextInput } from "@/components/ui/Field";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { PERSONAS, type PersonaId } from "@/lib/personas";
import { useUI } from "@/lib/store";
import type { Mode } from "@/lib/types";

export const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: "explain", label: "Explain" },
  { value: "reverse", label: "Catch the mistake" },
];

export function StartSession({ hasNotes }: { hasNotes: boolean }) {
  const router = useRouter();
  const { currentTopic, setCurrentTopic, draftMode, setDraftMode, draftPersona, setDraftPersona } =
    useUI();
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const topic = currentTopic.trim();
    if (!topic) {
      setError("Enter a topic first, for example \"How do vaccines work?\"");
      return;
    }
    const params = new URLSearchParams({ topic, mode: draftMode });
    if (draftMode === "explain") params.set("persona", draftPersona);
    router.push(`/session?${params.toString()}`);
  }

  return (
    <section aria-labelledby="start-heading" className="border border-line bg-surface p-6 rounded-sm">
      <h2 id="start-heading" className="mb-4 text-xl">Start a session</h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="topic">Topic</Label>
          <TextInput
            id="topic"
            value={currentTopic}
            onChange={(e) => {
              setCurrentTopic(e.target.value);
              setError("");
            }}
            placeholder="Why do seasons happen?"
            maxLength={120}
            aria-describedby={error ? "topic-error" : undefined}
          />
          {error && (
            <p id="topic-error" className="mt-1 text-sm text-missing">{error}</p>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          <div>
            <span className="mb-1 block text-sm font-medium text-ink-2">Mode</span>
            <SegmentedToggle label="Mode" options={MODE_OPTIONS} value={draftMode} onChange={setDraftMode} />
          </div>
          {draftMode === "explain" && (
            <div className="min-w-[220px]">
              <Label htmlFor="persona">Explain it to</Label>
              <Select
                id="persona"
                value={draftPersona}
                onChange={(e) => setDraftPersona(e.target.value as PersonaId)}
              >
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary">Begin session</Button>
          {hasNotes && (
            <Link
              href={currentTopic.trim() ? `/notes?topic=${encodeURIComponent(currentTopic.trim())}` : "/notes"}
              className="text-sm underline underline-offset-2"
            >
              Use my notes for this topic
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}
