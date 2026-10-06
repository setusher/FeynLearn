"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Working } from "@/components/ui/Working";
import { autoSeed } from "@/lib/seed";
import { useSettings } from "@/lib/settings";

let seeding: Promise<boolean> | null = null;
/** Seed once per page load even if several components ask at the same time. */
export function ensureSeeded(): Promise<boolean> {
  seeding ??= autoSeed().catch(() => false);
  return seeding;
}

/**
 * Shows the app only once settings are loaded. First launch (no name yet) goes
 * to /welcome; demo data is loaded automatically the first time.
 */
export function FirstRunGate({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const router = useRouter();
  const needsName = settings !== undefined && !settings.name;

  useEffect(() => {
    if (!settings) return;
    if (!settings.seeded) void ensureSeeded();
    if (!settings.name) router.replace("/welcome");
  }, [settings, router]);

  if (!settings || needsName) return <Working />;
  return <>{children}</>;
}
