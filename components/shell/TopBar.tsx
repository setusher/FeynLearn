"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { useNow } from "@/lib/hooks";
import { initials, useSettings } from "@/lib/settings";
import { streakDays } from "@/lib/stats";
import { NavTabs } from "./NavTabs";

export function Logo() {
  return (
    <Link
      href="/welcome"
      aria-label="FeynLearn, back to the welcome screen"
      className="flex shrink-0 items-center gap-2.5 text-text no-underline"
    >
      <span aria-hidden className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-lime text-[18px] font-bold text-on-lime">
        F
      </span>
      <span className="text-[24px] font-bold tracking-tight tab:text-[28px]">FeynLearn</span>
    </Link>
  );
}

export function TopBar() {
  const settings = useSettings();
  const now = useNow();
  const sessions = useLiveQuery(() => db.sessions.toArray());
  const streak = sessions && now ? streakDays(sessions, now) : 0;
  const name = settings?.name;

  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 tab:px-6 desk:h-[72px] desk:flex-nowrap desk:py-0">
        <Logo />
        <div className="order-3 w-full min-w-0 desk:order-none desk:flex desk:w-auto desk:flex-1 desk:justify-center">
          <NavTabs />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="tnum hidden h-9 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[13px] font-semibold text-text-2 tab:inline-flex">
            <span className="text-lime">{streak}</span> day streak
          </span>
          <Link
            href="/settings"
            aria-label="Settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-card text-text-2 transition-colors duration-150 hover:text-text"
          >
            <SettingsIcon size={16} strokeWidth={1.75} aria-hidden />
          </Link>
          <Link
            href="/settings"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-card pl-1 pr-3 text-[13px] font-semibold text-text no-underline transition-colors duration-150 hover:border-text-3"
          >
            <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-lime text-[11px] font-bold text-on-lime">
              {initials(name)}
            </span>
            <span className="max-w-[120px] truncate">{name || "Guest"}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
