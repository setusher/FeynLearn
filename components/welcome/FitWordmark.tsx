"use client";

import { useLayoutEffect, useRef, useState } from "react";

const PROBE = 100; // px used to measure the text before scaling

/**
 * A single line of text whose font size is set so it spans exactly the width of
 * its container. It measures the text at 100px, scales the size by
 * container width / measured width, and re-runs on resize and once web fonts
 * have loaded (so the measurement uses Manrope, not the fallback font).
 */
export function FitWordmark({ text, className = "" }: { text: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const container = box.current;
    const measure = probe.current;
    if (!container || !measure) return;

    const fit = () => {
      const width = measure.getBoundingClientRect().width;
      if (width > 0) setSize((PROBE * container.clientWidth) / width);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    let alive = true;
    void document.fonts?.ready.then(() => alive && fit());
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [text]);

  return (
    <div ref={box} aria-hidden="true" className={`relative w-full ${className}`}>
      {/* Hidden probe at a fixed size; same font, weight and tracking as the visible text.
          Wrapped in a zero-size clipping box so it never causes horizontal scroll. */}
      <div className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden">
        <span ref={probe} className="invisible whitespace-nowrap font-bold tracking-[-0.04em]" style={{ fontSize: PROBE }}>
          {text}
        </span>
      </div>
      <p
        className="whitespace-nowrap pb-[0.14em] font-bold leading-[0.85] tracking-[-0.04em]"
        // Until measured, fall back to a width-based guess so there is no layout jump on fast loads.
        style={{ fontSize: size ?? "21vw" }}
      >
        {text}
      </p>
    </div>
  );
}
