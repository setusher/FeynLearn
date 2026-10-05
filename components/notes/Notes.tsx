"use client";

import { Upload } from "lucide-react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Label, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ErrorLine, PageHeader, StatusLine } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/format";
import { useAllData } from "@/lib/hooks";
import { addNote, deleteNote, extractText, linkNote } from "@/lib/noteStore";
import type { Note, Topic } from "@/lib/types";

function size(chars: number): string {
  return chars < 1000 ? `${chars} characters` : `${(chars / 1000).toFixed(chars < 10_000 ? 1 : 0)}k characters`;
}

function NoteRow({ note, topics, forTopic }: { note: Note; topics: Topic[]; forTopic?: string }) {
  const [confirm, setConfirm] = useState(false);
  const linked = topics.filter((t) => t.noteId === note.id);
  const unlinked = topics.filter((t) => t.noteId !== note.id);
  const forTopicLinked = forTopic && linked.some((t) => t.name.toLowerCase() === forTopic.toLowerCase());

  return (
    <li className="border-b border-line py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{note.title}</p>
        <p className="tnum text-sm text-ink-2">
          {size(note.text.length)} · added {formatDate(note.createdAt)}
        </p>
      </div>

      <div className="mt-2 text-sm">
        <span className="text-ink-2">Linked topic{linked.length === 1 ? "" : "s"}: </span>
        {linked.length === 0 ? (
          <span className="text-ink-2">none</span>
        ) : (
          linked.map((t, i) => (
            <span key={t.id}>
              {i > 0 && ", "}
              {t.name}{" "}
              <button type="button" className="text-accent underline underline-offset-2" onClick={() => linkNote({ id: t.id }, null)}>
                unlink
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        {forTopic && !forTopicLinked && (
          <Button onClick={() => linkNote({ name: forTopic }, note.id)}>Use for &ldquo;{forTopic}&rdquo;</Button>
        )}
        {unlinked.length > 0 && (
          <div className="min-w-[220px]">
            <Label htmlFor={`link-${note.id}`}>Link to a topic</Label>
            <Select
              id={`link-${note.id}`}
              value=""
              onChange={(e) => e.target.value && linkNote({ id: e.target.value }, note.id)}
            >
              <option value="">Choose a topic...</option>
              {unlinked.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
          </div>
        )}
        {confirm ? (
          <span className="flex items-center gap-3 text-sm">
            Delete this note?
            <Button variant="secondary" onClick={() => deleteNote(note.id)}>Delete</Button>
            <button type="button" className="text-accent underline underline-offset-2" onClick={() => setConfirm(false)}>Cancel</button>
          </span>
        ) : (
          <button type="button" className="text-sm text-accent underline underline-offset-2" onClick={() => setConfirm(true)}>
            Delete note
          </button>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ink-2">Preview</summary>
        <p className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap border-l-2 border-line pl-3 text-ink-2">
          {note.text.slice(0, 2000)}
          {note.text.length > 2000 ? "..." : ""}
        </p>
      </details>
    </li>
  );
}

export function Notes({ forTopic }: { forTopic?: string }) {
  const data = useAllData();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setStatus(`Reading ${file.name}...`);
    try {
      const extracted = await extractText(file);
      if (!extracted.trim()) {
        setStatus("");
        setError("No text found in this file. Scanned PDFs are images; paste the text below instead.");
        return;
      }
      const note = await addNote(file.name.replace(/\.(pdf|txt|md)$/i, ""), extracted);
      if (forTopic) await linkNote({ name: forTopic }, note.id);
      setStatus(`Added "${note.title}" (${size(note.text.length)})${forTopic ? ` and linked it to "${forTopic}"` : ""}.`);
    } catch {
      setStatus("");
      setError("Could not read this file. Try a different PDF or paste the text instead.");
    }
  }

  async function onPaste(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    const note = await addNote(title, text);
    if (forTopic) await linkNote({ name: forTopic }, note.id);
    setTitle("");
    setText("");
    setStatus(`Added "${note.title}"${forTopic ? ` and linked it to "${forTopic}"` : ""}.`);
  }

  if (!data) return <StatusLine>Loading...</StatusLine>;
  const notes = [...data.notes].sort((a, b) => b.createdAt - a.createdAt);
  const topics = [...data.topics].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-[860px]">
      <PageHeader
        title="Notes"
        intro="Add your class notes and link them to a topic. The AI then judges your explanations against them, and builds exercises from them."
      />

      <p className="mb-8 border-l-[3px] border-accent bg-surface px-4 py-3 text-sm">
        Your notes stay in your browser; only the excerpt used in a session is sent to the AI.
      </p>

      {forTopic && (
        <p className="mb-6">
          Choose or add a note to use for <span className="font-medium">&ldquo;{forTopic}&rdquo;</span>.
        </p>
      )}

      <section aria-labelledby="add-heading" className="border border-line bg-surface p-5">
        <h2 id="add-heading" className="text-lg">Add a note</h2>

        <div className="mt-4">
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-sm border border-line px-4 text-sm font-medium transition-colors duration-150 hover:bg-bg focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent">
            <Upload size={16} strokeWidth={1.5} aria-hidden />
            Upload PDF or TXT
            <input type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" onChange={onFile} className="sr-only" />
          </label>
          <p className="mt-1 text-xs text-ink-2">Text is extracted in your browser. Scanned (image-only) PDFs have no text to extract.</p>
        </div>

        <form onSubmit={onPaste} className="mt-6 flex flex-col gap-3 border-t border-line pt-5">
          <p className="text-sm text-ink-2">Or paste text</p>
          <div>
            <Label htmlFor="note-title">Title</Label>
            <TextInput id="note-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Biology, chapter 4" />
          </div>
          <div>
            <Label htmlFor="note-text">Text</Label>
            <TextArea id="note-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div>
            <Button type="submit" disabled={!text.trim()}>Save note</Button>
          </div>
        </form>

        {status && <p role="status" className="mt-4 text-sm text-solid">{status}</p>}
        {error && <div className="mt-4"><ErrorLine message={error} /></div>}
      </section>

      <section aria-labelledby="list-heading" className="mt-12">
        <h2 id="list-heading" className="mb-3 text-xl">Your notes</h2>
        {notes.length === 0 ? (
          <p className="text-ink-2">No notes yet.</p>
        ) : (
          <ul className="border-t border-line">
            {notes.map((n) => (
              <NoteRow key={n.id} note={n} topics={topics} forTopic={forTopic} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
