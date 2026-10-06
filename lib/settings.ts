"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { Settings } from "./types";

const DEFAULTS: Settings = { key: "app", theme: "dark", seeded: false };

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get("app")) ?? DEFAULTS;
}

export async function updateSettings(patch: Partial<Omit<Settings, "key">>): Promise<void> {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, key: "app" });
}

/** Live settings; `undefined` while IndexedDB is loading. */
export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => (await db.settings.get("app")) ?? DEFAULTS);
}

export function initials(name: string | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}
