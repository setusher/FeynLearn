"use client";

import { FileText, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type DragEvent } from "react";
import { Box } from "@/components/ui/Box";
import { buttonClass } from "@/components/ui/Button";
import { Chip, SampleChip } from "@/components/ui/Chip";
import { addNote, deleteNote, extractText } from "@/lib/noteStore";
import type { DashData } from "./types";

const ACCEPT = ".pdf,.txt,.md,application/pdf,text/plain";

function size(chars: number) {
  return chars < 1000 ? `${chars} chars` : `${Math.round(chars / 1000)}k chars`;
}

export function NotesBox({ data }: { data: DashData }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const notes = [...data.notes].sort((a, b) => b.createdAt - a.createdAt);

  async function handle(file: File | undefined) {
    if (!file) return;
    setError("");
    setStatus(`Reading ${file.name}...`);
    try {
      const text = await extractText(file);
      if (!text.trim()) {
        setStatus("");
        setError("No text found. Scanned PDFs are images; paste the text instead.");
        return;
      }
      const note = await addNote(file.name.replace(/\.(pdf|txt|md)$/i, ""), text);
      setStatus(`Added "${note.title}".`);
    } catch {
      setStatus("");
      setError("Could not read that file. Try another PDF or paste the text.");
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    void handle(e.dataTransfer.files?.[0]);
  }

  return (
    <Box
      id="notes"
      title="Notes"
      href="/notes"
      className="area-g"
      extra={notes.some((n) => n.sample) ? <SampleChip /> : undefined}
      bodyClassName="gap-2"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-dashed px-3 py-2.5 transition-colors duration-150 ${
          over ? "border-lime bg-card-2" : "border-line"
        }`}
      >
        <p className="flex items-center gap-2 text-[13px] text-text-2">
          <Upload size={16} strokeWidth={1.75} aria-hidden className="text-text" />
          <span>
            Drop a PDF or TXT here, or{" "}
            <button type="button" onClick={() => input.current?.click()} className="font-semibold text-lime underline underline-offset-2">
              browse
            </button>
          </span>
        </p>
        <Link href="/notes" className={buttonClass("secondary", "h-8 rounded-[10px] px-3 text-[12px]")}>Paste text</Link>
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload a PDF or TXT file"
          onChange={(e) => {
            void handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {(status || error) && (
        <p role={error ? "alert" : "status"} className={`text-[12px] ${error ? "text-missing" : "text-text-2"}`}>
          {error || status}
        </p>
      )}

      <ul className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {notes.map((n) => {
          const linked = data.topics.find((t) => t.noteId === n.id);
          return (
            <li key={n.id} className="flex items-center gap-2 border-b border-line py-1.5 last:border-b-0">
              <FileText size={15} strokeWidth={1.75} aria-hidden className="shrink-0 text-text-2" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{n.title}</span>
              <span className="tnum shrink-0 text-[11px] text-text-2">{size(n.text.length)}</span>
              {linked && <Chip className="hidden max-w-[150px] desk:inline-flex"><span className="truncate">{linked.name}</span></Chip>}
              {confirmId === n.id ? (
                <span className="flex shrink-0 items-center gap-1 text-[12px]">
                  <button type="button" onClick={() => deleteNote(n.id)} className="font-semibold text-missing">Remove</button>
                  <button type="button" onClick={() => setConfirmId(null)} className="text-text-2">Keep</button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(n.id)}
                  aria-label={`Remove ${n.title}`}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-text-2 hover:bg-card-2 hover:text-text"
                >
                  <X size={14} strokeWidth={1.75} aria-hidden />
                </button>
              )}
            </li>
          );
        })}
        {notes.length === 0 && <li className="text-[13px] text-text-2">No notes yet.</li>}
      </ul>

      <p className="text-[11px] text-text-2">Notes stay in your browser. Only the excerpt used in a session is sent to the AI.</p>
    </Box>
  );
}
