"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorLine } from "@/components/ui/PageHeader";
import { clearAllData, exportAllData } from "@/lib/db";

export function Settings() {
  const [confirming, setConfirming] = useState(false);
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

  async function onClear() {
    setError("");
    try {
      await clearAllData();
      setConfirming(false);
      setStatus("All data cleared. The dashboard is back to its first-run state.");
    } catch {
      setError("Could not clear data. Try again, or clear site data from your browser settings.");
    }
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-10">
      {status && <p role="status" className="text-sm text-solid">{status}</p>}
      {error && <ErrorLine message={error} />}

      <section aria-labelledby="export-heading">
        <h2 id="export-heading" className="text-xl">Export data</h2>
        <p className="mb-3 mt-1 text-ink-2">
          Download every topic, session, challenge and note as a JSON file.
        </p>
        <Button variant="secondary" onClick={onExport}>Export data (JSON)</Button>
      </section>

      <section aria-labelledby="clear-heading" className="border-t border-line pt-8">
        <h2 id="clear-heading" className="text-xl">Clear all data</h2>
        <p className="mb-3 mt-1 text-ink-2">
          Removes everything stored in this browser, including the sample topic. This cannot be undone.
        </p>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm">Delete all data from this browser?</span>
            <Button
              onClick={onClear}
              className="border-missing! bg-missing! hover:opacity-90"
            >
              Yes, clear everything
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => { setStatus(""); setConfirming(true); }}>
            Clear all data
          </Button>
        )}
      </section>
    </div>
  );
}
