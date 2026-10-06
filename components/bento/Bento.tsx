"use client";

import { Working } from "@/components/ui/Working";
import { useAllData, useNow } from "@/lib/hooks";
import { useSettings } from "@/lib/settings";
import { ApplyBox } from "./ApplyBox";
import { GapMapBox } from "./GapMapBox";
import { NotesBox } from "./NotesBox";
import { RevisitBox } from "./RevisitBox";
import { SessionBox } from "./SessionBox";
import { StatsBox } from "./StatsBox";
import { UnderstandingBox } from "./UnderstandingBox";

/** The dashboard: seven boxes on the bento grid defined in globals.css. */
export function Bento() {
  const data = useAllData();
  const now = useNow();
  const settings = useSettings();
  if (!data || now === 0) return <Working />;
  const d = { ...data, now };

  return (
    <div className="bento">
      <SessionBox data={d} name={settings?.name} />
      <UnderstandingBox data={d} />
      <RevisitBox data={d} />
      <StatsBox data={d} />
      <GapMapBox data={d} />
      <ApplyBox data={d} />
      <NotesBox data={d} />
    </div>
  );
}
