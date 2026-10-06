"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ensureSeeded } from "@/components/shell/FirstRunGate";
import { updateSettings, useSettings } from "@/lib/settings";

const STEPS = [
  { title: "Explain it.", text: "Teach a topic to a learner who knows nothing and keeps asking why." },
  { title: "Catch the mistake.", text: "Find the errors planted in someone else's explanation." },
  { title: "Apply it.", text: "Use the idea on a real situation and get graded on your reasoning." },
];

export function WelcomeScreen() {
  const settings = useSettings();
  const router = useRouter();
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const savedName = settings?.name ?? "";
  const name = draft ?? savedName;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().slice(0, 40);
    if (!clean) {
      setError("Type a name, or any word you like to be called.");
      return;
    }
    setBusy(true);
    try {
      await updateSettings({ name: clean });
      await ensureSeeded();
      router.push("/");
    } catch {
      setError("Could not save that. Your browser may be blocking local storage.");
      setBusy(false);
    }
  }

  return (
    <main className="welcome flex min-h-screen flex-col justify-between gap-12 bg-lime p-6 text-on-lime tab:p-10 desk:p-14">
      <div className="max-w-[960px]">
        <h1 className="text-[56px] font-bold leading-none tracking-tight tab:text-[72px]">
          {savedName ? `Hi, ${savedName}.` : "Hi."}
        </h1>

        <form onSubmit={onSubmit} className="mt-6 flex max-w-[620px] flex-col gap-2">
          <label htmlFor="welcome-name" className="text-[18px] font-semibold">
            {savedName ? "Not you? Change your name, or carry on." : "What should I call you?"}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="welcome-name"
              value={name}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              maxLength={40}
              autoComplete="given-name"
              placeholder="Your name"
              className="h-12 min-w-[220px] flex-1 rounded-[12px] border-2 border-on-lime bg-transparent px-4 text-[17px] font-semibold text-on-lime placeholder:text-on-lime/60"
            />
            <Button type="submit" variant="dark" disabled={busy || settings === undefined} className="h-12">
              {busy ? "Working..." : savedName && name.trim() === savedName ? "Continue" : "Enter"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-[14px] font-semibold">
              {error}
            </p>
          )}
        </form>

        <ul className="mt-12 grid max-w-[900px] gap-6 tab:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.title}>
              <p className="text-[18px] font-bold">{s.title}</p>
              <p className="mt-1 text-[14px] font-medium">{s.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[18px] font-semibold tab:text-[22px]">Learn it by teaching it.</p>
        <p
          aria-hidden
          className="pb-[0.12em] font-bold leading-[0.85] tracking-[-0.045em]"
          style={{ fontSize: "clamp(72px, 15vw, 200px)" }}
        >
          FeynLearn
        </p>
      </div>
    </main>
  );
}
