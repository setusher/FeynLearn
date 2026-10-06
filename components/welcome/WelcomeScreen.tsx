"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ensureSeeded } from "@/components/shell/FirstRunGate";
import { updateSettings, useSettings } from "@/lib/settings";
import { FitWordmark } from "./FitWordmark";

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
  const input = useRef<HTMLInputElement>(null);

  const savedName = settings?.name ?? "";
  const returning = savedName.length > 0;
  const name = draft ?? savedName;
  const clean = name.trim().slice(0, 40);

  // First visit: focus the name box once settings have loaded.
  useEffect(() => {
    if (settings && !settings.name) input.current?.focus();
  }, [settings]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clean) return;
    setBusy(true);
    try {
      if (clean !== savedName) await updateSettings({ name: clean });
      await ensureSeeded();
      router.push("/");
    } catch {
      setError("Could not save your name. Your browser may be blocking local storage.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col bg-bg px-[20px] text-lime tab:px-[48px]">
      {/* Zone 1: top row */}
      <div className="flex h-[64px] shrink-0 items-center justify-between gap-4 border-b border-line">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-[8px] bg-lime text-[15px] font-bold text-on-lime">
            F
          </span>
          <span className="text-[20px] font-bold tracking-tight">FeynLearn</span>
        </span>
        {returning && (
          <Link href="/" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-lime no-underline hover:underline">
            Skip to dashboard
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </Link>
        )}
      </div>

      {/* Zone 2: greeting and form on the left, how it works on the right */}
      <div className="grid flex-1 content-center gap-x-6 gap-y-12 py-10 desk:grid-cols-12 desk:py-8">
        <section className="desk:col-span-6" aria-labelledby="welcome-greeting">
          <h1 id="welcome-greeting" className="welcome-hi break-words font-bold text-lime">
            {returning ? `Hi, ${savedName}.` : "Hi."}
          </h1>
          <p id="welcome-sub" className="mt-4 text-[20px] text-text-2">
            {returning ? "Not you? Change your name, or carry on." : "What should I call you?"}
          </p>

          <form onSubmit={onSubmit} className="mt-6 flex max-w-[720px] flex-col gap-3 tab:flex-row">
            <label htmlFor="welcome-name" className="sr-only">Your name</label>
            <input
              id="welcome-name"
              value={name}
              onChange={(e) => {
                setDraft(e.target.value);
                setError("");
              }}
              maxLength={40}
              autoComplete="given-name"
              ref={input}
              aria-describedby="welcome-sub"
              placeholder="Your name"
              className="h-14 w-full min-w-0 rounded-[12px] border border-line bg-card px-4 text-[18px] text-text placeholder:text-text-2 transition-colors duration-150 focus:border-2 focus:border-lime focus:px-[15px] tab:max-w-[560px] tab:flex-1"
            />
            <button
              type="submit"
              disabled={!clean || busy || settings === undefined}
              className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-lime px-6 text-[17px] font-semibold text-on-lime transition-colors duration-150 hover:bg-lime-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Working..." : "Continue"}
              <ArrowRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-3 text-[15px] text-missing">
              {error}
            </p>
          )}
        </section>

        <section className="desk:col-span-5 desk:col-start-8" aria-label="How it works">
          <ol className="border-y border-line">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex gap-5 border-b border-line px-4 py-6 transition-colors duration-150 last:border-b-0 hover:bg-card"
              >
                <span className="tnum pt-2 text-[14px] font-semibold text-lime">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="block text-[22px] font-semibold leading-tight text-lime tab:text-[28px]">{s.title}</span>
                  <span className="mt-1 block text-[16px] text-text-2">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* Zone 3: tagline and the full-width wordmark */}
      <div className="shrink-0 pb-[24px]">
        <p className="mb-[8px] text-[22px] font-medium text-lime">Learn it by teaching it.</p>
        <FitWordmark text="FeynLearn" className="text-lime" />
      </div>
    </main>
  );
}
