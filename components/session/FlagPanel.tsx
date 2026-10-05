"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Field";

/** In-flow side panel for flagging the selected paragraph. */
export function FlagPanel({
  index,
  existing,
  flagCount,
  onSubmit,
  onRemove,
}: {
  index: number | null;
  existing?: string;
  flagCount: number;
  onSubmit: (reason: string) => void;
  onRemove: () => void;
}) {
  const [reason, setReason] = useState(existing ?? "");

  if (index === null) {
    return (
      <aside className="border-t border-line pt-4 text-sm text-ink-2 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <p>Click a paragraph you think is wrong, then say what is wrong with it.</p>
        <p className="mt-2">
          {flagCount === 0 ? "No flags yet." : `${flagCount} ${flagCount === 1 ? "paragraph" : "paragraphs"} flagged.`}
        </p>
      </aside>
    );
  }

  return (
    <aside className="border-t border-line pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(reason.trim());
        }}
      >
        <p className="text-sm text-ink-2">Paragraph {index + 1}</p>
        <label htmlFor="flag-reason" className="mt-2 block text-sm font-medium">
          What&apos;s wrong with this?
        </label>
        <TextArea
          id="flag-reason"
          rows={5}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Say what is incorrect and what the right fact is."
          className="mt-1"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button type="submit">{existing !== undefined ? "Update flag" : "Submit flag"}</Button>
          {existing !== undefined && (
            <Button variant="secondary" onClick={onRemove}>Remove flag</Button>
          )}
        </div>
      </form>
    </aside>
  );
}
