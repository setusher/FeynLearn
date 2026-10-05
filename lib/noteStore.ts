import { db, getOrCreateTopic, newId } from "./db";
import { excerptFor } from "./notes";
import type { Note } from "./types";

// Browser-side note storage, text extraction and linking.

export const MAX_NOTE_CHARS = 400_000;

export async function extractText(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return file.text();

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
        .join("")
        .replace(/[ \t]+/g, " "),
    );
  }
  return pages.join("\n\n").trim();
}

export async function addNote(title: string, text: string): Promise<Note> {
  const note: Note = {
    id: newId(),
    title: title.trim().slice(0, 120) || "Untitled note",
    text: text.slice(0, MAX_NOTE_CHARS),
    createdAt: Date.now(),
  };
  await db.notes.add(note);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  await db.transaction("rw", [db.notes, db.topics], async () => {
    await db.notes.delete(id);
    await db.topics.filter((t) => t.noteId === id).modify({ noteId: undefined });
  });
}

/** Link a note to a topic (by id or by name, creating the topic), or unlink with null. */
export async function linkNote(topic: { id?: string; name?: string }, noteId: string | null): Promise<void> {
  const id = topic.id ?? (topic.name ? (await getOrCreateTopic(topic.name)).id : undefined);
  if (!id) return;
  await db.topics.update(id, { noteId: noteId ?? undefined });
}

/** The excerpt of the note linked to this topic, if any. */
export async function notesExcerptFor(topicName: string, focus?: string): Promise<string | undefined> {
  const topic = await db.topics.filter((t) => t.name.toLowerCase() === topicName.trim().toLowerCase()).first();
  if (!topic?.noteId) return undefined;
  const note = await db.notes.get(topic.noteId);
  if (!note) return undefined;
  return excerptFor(note.text, `${topicName} ${focus ?? ""}`) || undefined;
}

/** Title of the note linked to this topic, for showing "Using your notes" in a session. */
export async function linkedNoteTitle(topicName: string): Promise<string | undefined> {
  const topic = await db.topics.filter((t) => t.name.toLowerCase() === topicName.trim().toLowerCase()).first();
  return topic?.noteId ? (await db.notes.get(topic.noteId))?.title : undefined;
}
