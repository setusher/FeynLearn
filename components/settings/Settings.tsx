"use client";

import { useState, type FormEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { clearAllData, exportAllData } from "@/lib/db";
import { seedSampleData } from "@/lib/seed";
import { updateSettings, useSettings } from "@/lib/settings";

function Status({ text, error }: { text: string; error?: boolean }) {
  if (!text) return null;
  return (
    <p role={error ? "alert" : "status"} className={`text-[13px] ${error ? "text-missing" : "text-lime"}`}>
      {text}
    </p>
  );
}

function NameBox() {
  const settings = useSettings();
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const name = draft ?? settings?.name ?? "";

  async function save(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim().slice(0, 40);
    if (!clean) return;
    await updateSettings({ name: clean });
    setDraft(null);
    setStatus("Saved.");
  }

  return (
    <Box id="set-name" title="Your name" bodyClassName="gap-3">
      <form onSubmit={save} className="flex flex-col gap-3">
        <label htmlFor="settings-name" className="text-[13px] text-text-2">Shown in the top bar and the dashboard greeting.</label>
        <div className="flex flex-wrap gap-2">
          <input
            id="settings-name"
            value={name}
            maxLength={40}
            onChange={(e) => {
              setDraft(e.target.value);
              setStatus("");
            }}
            className="h-10 min-w-[180px] flex-1 rounded-[12px] border border-line bg-card-2 px-3 text-[14px] text-text hover:border-text-3"
          />
          <Button type="submit" disabled={!name.trim()}>Save</Button>
        </div>
      </form>
      <Status text={status} />
    </Box>
  );
}

function DemoBox() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function load() {
    setError("");
    setStatus("Working...");
    try {
      await seedSampleData();
      setStatus("Demo data loaded: two topics, past sessions, a challenge and a note.");
    } catch {
      setStatus("");
      setError("Could not load demo data.");
    }
  }
  return (
    <Box id="set-demo" title="Demo data" bodyClassName="gap-3">
      <p className="text-[13px] text-text-2">
        Adds two sample topics (seasons and compound interest) with past sessions, a gap map, a challenge and a
        note, all labeled as sample data. Loading again replaces the earlier sample.
      </p>
      <div>
        <Button onClick={load}>Load demo data</Button>
      </div>
      <Status text={error || status} error={!!error} />
    </Box>
  );
}

function ExportBox() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function onExport() {
    setError("");
    try {
      const json = await exportAllData();
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `feynlearn-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Export downloaded.");
    } catch {
      setError("Could not export your data.");
    }
  }
  return (
    <Box id="set-export" title="Export data" bodyClassName="gap-3">
      <p className="text-[13px] text-text-2">Download every topic, session, challenge, note and setting as a JSON file.</p>
      <div>
        <Button variant="secondary" onClick={onExport}>Export data (JSON)</Button>
      </div>
      <Status text={error || status} error={!!error} />
    </Box>
  );
}

function ClearBox() {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function onClear() {
    setError("");
    try {
      await clearAllData();
      setConfirming(false);
      setStatus("All data cleared. Your name is kept. Use Load demo data to bring the sample back.");
    } catch {
      setError("Could not clear data. Try again, or clear site data in your browser.");
    }
  }
  return (
    <Box id="set-clear" title="Clear all data" bodyClassName="gap-3">
      <p className="text-[13px] text-text-2">
        Deletes every topic, session, challenge and note in this browser, including sample data. This cannot be undone.
      </p>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px]">Delete everything?</span>
          <Button onClick={onClear} className="border-missing! bg-missing! text-on-lime">Yes, clear everything</Button>
          <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
        </div>
      ) : (
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              setStatus("");
              setConfirming(true);
            }}
          >
            Clear all data
          </Button>
        </div>
      )}
      <Status text={error || status} error={!!error} />
    </Box>
  );
}

export function Settings() {
  return (
    <div className="grid gap-4 tab:grid-cols-2">
      <NameBox />
      <DemoBox />
      <ExportBox />
      <ClearBox />
    </div>
  );
}
