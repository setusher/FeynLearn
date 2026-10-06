"use client";

import { SessionPanel } from "@/components/sessionbox/SessionPanel";
import { Working } from "@/components/ui/Working";
import { useAllData, useNow } from "@/lib/hooks";
import { ApplyBox } from "./ApplyBox";
import { GapMapBox } from "./GapMapBox";
import { NotesBox } from "./NotesBox";
import { RevisitBox } from "./RevisitBox";
import { StatsBox } from "./StatsBox";
import { UnderstandingBox } from "./UnderstandingBox";

/** The dashboard: seven boxes on the bento grid defined in globals.css. */
export function Bento() {
  const data = useAllData();
  const now = useNow();
  if (!data || now === 0) return <Working />;
  const d = { ...data, now };

  return (
    <div className="bento">
      <h1 className="sr-only">Dashboard</h1>
      <SessionPanel data={d} shell={{ id: "session", href: "/session", className: "area-a" }} />
      <UnderstandingBox data={d} />
      <RevisitBox data={d} />
      <StatsBox data={d} />
      <GapMapBox data={d} />
      <ApplyBox data={d} />
      <NotesBox data={d} />
    </div>
  );
}
