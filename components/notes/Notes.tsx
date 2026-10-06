"use client";

import { FileText, Upload, X } from "lucide-react";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Working } from "@/components/ui/Working";
import { formatDate } from "@/lib/format";
import { useAllData } from "@/lib/hooks";
import { addNote, deleteNote, extractText, linkNote } from "@/lib/noteStore";
import type { Note, Topic } from "@/lib/types";

const ACCEPT = ".pdf,.txt,.md,application/pdf,text/plain";

function size(chars: number): string {
  return chars < 1000 ? `${chars} characters` : `${(chars / 1000).toFixed(chars < 10_000 ? 1 : 0)}k characters`;
}

function AddBox({ forTopic, onAdded }: { forTopic?: string; onAdded: (note: Note) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [paste, setPaste] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function added(note: Note) {
    if (forTopic) await linkNote({ name: forTopic }, note.id);
    setStatus(`Added "${note.title}" (${size(note.text.length)})${forTopic ? `, linked to "${forTopic}"` : ""}.`);
    onAdded(note);
  }

  async function handle(file: File | undefined) {
    if (!file) return;
    setError("");
    setStatus(`Reading ${file.name}...`);
    try {
      const extracted = await extractText(file);
      if (!extracted.trim()) {
        setStatus("");
        setError("No text found in this file. Scanned PDFs are images; paste the text instead.");
        return;
      }
      await added(await addNote(file.name.replace(/\.(pdf|txt|md)$/i, ""), extracted));
    } catch {
      setStatus("");
      setError("Could not read this file. Try a different PDF or paste the text.");
    }
  }

  async function onPaste(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    await added(await addNote(title, text));
    setTitle("");
    setText("");
    setPaste(false);
  }

  return (
    <Box id="add-note" title="Add notes" className="desk:col-span-5" bodyClassName="gap-3">
      {forTopic && (
        <p className="text-[13px]">
          New notes will be linked to <span className="font-semibold text-lime">&ldquo;{forTopic}&rdquo;</span>.
        </p>
      )}
      {!paste ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            setOver(false);
            void handle(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed px-4 py-8 text-center transition-colors duration-150 ${
            over ? "border-lime bg-card-2" : "border-line"
          }`}
        >
          <Upload size={28} strokeWidth={1.5} aria-hidden className="text-lime" />
          <p className="text-[15px] font-semibold">Drop a PDF or TXT here</p>
          <p className="text-[13px] text-text-2">Text is extracted in your browser.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => input.current?.click()}>Browse files</Button>
            <Button variant="secondary" onClick={() => setPaste(true)}>Paste text</Button>
          </div>
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
      ) : (
        <form onSubmit={onPaste} className="flex flex-col gap-2">
          <label htmlFor="note-title" className="text-[13px] text-text-2">Title</label>
          <input
            id="note-title"
            value={title}
            maxLength={120}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Biology, chapter 4"
            className="h-10 rounded-[12px] border border-line bg-card-2 px-3 text-[14px] text-text placeholder:text-text-3"
          />
          <label htmlFor="note-text" className="text-[13px] text-text-2">Text</label>
          <textarea
            id="note-text"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="rounded-[12px] border border-line bg-card-2 p-3 text-[14px] text-text"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={!text.trim()}>Save note</Button>
            <Button variant="secondary" onClick={() => setPaste(false)}>Cancel</Button>
          </div>
        </form>
      )}
      {status && !error && (
        status.startsWith("Reading") ? <Working label={status} /> : <p role="status" className="text-[13px] text-lime">{status}</p>
      )}
      {error && <p role="alert" className="text-[13px] text-missing">{error}</p>}
      <p className="mt-auto text-[12px] text-text-2">Notes stay in your browser. Only the excerpt used in a session is sent to the AI.</p>
    </Box>
  );
}

function ListBox({
  notes,
  topics,
  selectedId,
  onSelect,
}: {
  notes: Note[];
  topics: Topic[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  return (
    <Box id="note-list" title={`Your notes${notes.length ? ` (${notes.length})` : ""}`} className="min-h-[220px] desk:col-span-5 desk:min-h-0" bodyClassName="gap-2">
      {notes.length === 0 ? (
        <p className="text-[13px] text-text-2">No notes yet. Add a PDF, a TXT file or pasted text.</p>
      ) : (
        <ul className="flex min-h-0 flex-col gap-1.5 overflow-y-auto">
          {notes.map((n) => {
            const linked = topics.filter((t) => t.noteId === n.id);
            const on = n.id === selectedId;
            return (
              <li key={n.id} className={`flex items-center gap-2 rounded-[10px] border px-2.5 py-2 ${on ? "border-lime bg-card-2" : "border-line"}`}>
                <button type="button" aria-pressed={on} onClick={() => onSelect(n.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                  <FileText size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-text-2" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold">{n.title}</span>
                    <span className="tnum block text-[11px] text-text-2">
                      {size(n.text.length)} · {formatDate(n.createdAt)}
                      {linked.length ? ` · ${linked.length} linked` : ""}
                    </span>
                  </span>
                  {n.sample && <Chip>Sample</Chip>}
                </button>
                {confirmId === n.id ? (
                  <span className="flex shrink-0 items-center gap-2 text-[12px]">
                    <button type="button" onClick={() => deleteNote(n.id)} className="font-semibold text-missing">Remove</button>
                    <button type="button" onClick={() => setConfirmId(null)} className="text-text-2">Keep</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(n.id)}
                    aria-label={`Remove ${n.title}`}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-text-2 hover:bg-card-2 hover:text-text"
                  >
                    <X size={14} strokeWidth={1.75} aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Box>
  );
}

function PreviewBox({ note, topics, forTopic }: { note?: Note; topics: Topic[]; forTopic?: string }) {
  const linked = note ? topics.filter((t) => t.noteId === note.id) : [];
  const unlinked = note ? topics.filter((t) => t.noteId !== note.id) : [];
  const forTopicLinked = forTopic && linked.some((t) => t.name.toLowerCase() === forTopic.toLowerCase());

  return (
    <Box
      id="note-preview"
      title={note ? note.title : "Preview"}
      className="min-h-[420px] desk:col-span-7 desk:row-span-2 desk:min-h-0"
      bodyClassName="gap-3"
      extra={
        note && unlinked.length > 0 ? (
          <>
            <label htmlFor="link-topic" className="sr-only">Link to a topic</label>
            <select
              id="link-topic"
              value=""
              onChange={(e) => e.target.value && void linkNote({ id: e.target.value }, note.id)}
              className="h-8 max-w-[240px] rounded-[10px] border border-line bg-card-2 px-2 text-[12px] font-semibold text-text hover:border-text-3"
            >
              <option value="">Link to a topic...</option>
              {unlinked.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </>
        ) : undefined
      }
    >
      {!note ? (
        <p className="text-[13px] text-text-2">Select a note to read its extracted text and link it to a topic.</p>
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center gap-2 text-[13px]">
            <span className="text-text-2">Linked to:</span>
            {linked.length === 0 && <span className="text-text-2">no topic yet</span>}
            {linked.map((t) => (
              <span key={t.id} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-lime pl-3 pr-1 text-[12px] font-semibold">
                {t.name}
                <button
                  type="button"
                  onClick={() => linkNote({ id: t.id }, null)}
                  aria-label={`Unlink ${t.name}`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-card-2"
                >
                  <X size={12} strokeWidth={2} aria-hidden />
                </button>
              </span>
            ))}
            {forTopic && !forTopicLinked && (
              <Button className="h-7 px-3 text-[12px]" onClick={() => linkNote({ name: forTopic }, note.id)}>
                Use for &ldquo;{forTopic}&rdquo;
              </Button>
            )}
          </div>
          <p className="shrink-0 text-[12px] text-text-2">
            When a topic is linked, up to about 6,000 characters of the most relevant parts are sent with each AI request
            as the reference for what a good explanation includes.
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded-[12px] border border-line bg-bg p-4 text-[14px] leading-relaxed text-text-2">
            {note.text}
          </div>
        </>
      )}
    </Box>
  );
}

export function Notes({ forTopic }: { forTopic?: string }) {
  const data = useAllData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (!data) return <Working />;

  const notes = [...data.notes].sort((a, b) => b.createdAt - a.createdAt);
  const topics = [...data.topics].sort((a, b) => a.name.localeCompare(b.name));
  const forTopicNote = forTopic
    ? notes.find((n) => topics.some((t) => t.noteId === n.id && t.name.toLowerCase() === forTopic.toLowerCase()))
    : undefined;
  const selected = notes.find((n) => n.id === selectedId) ?? forTopicNote ?? notes[0];

  return (
    <div className="grid gap-4 desk:h-[calc(100vh-121px)] desk:min-h-[640px] desk:grid-cols-12 desk:grid-rows-[auto_minmax(0,1fr)]">
      <h1 className="sr-only">Notes</h1>
      <AddBox forTopic={forTopic} onAdded={(n) => setSelectedId(n.id)} />
      <PreviewBox note={selected} topics={topics} forTopic={forTopic} />
      <ListBox notes={notes} topics={topics} selectedId={selected?.id} onSelect={setSelectedId} />
    </div>
  );
}
