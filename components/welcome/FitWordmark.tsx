"use client";

import { useLayoutEffect, useRef, useState } from "react";

const PROBE = 100; // px used to measure the text before scaling

type Fit = { size: number; shift: number };

/**
 * Measure the visible ink of `text` at PROBE px using the probe element's font.
 * Uses canvas text metrics so the side bearings of the first and last letters are
 * excluded; falls back to the element's box width when they are unavailable.
 */
function measureInk(el: HTMLElement, text: string): { width: number; left: number } {
  const cs = getComputedStyle(el);
  const ctx = document.createElement("canvas").getContext("2d");
  if (ctx) {
    ctx.font = `${cs.fontWeight} ${PROBE}px ${cs.fontFamily}`;
    if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing;
    const m = ctx.measureText(text);
    const width = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    if (width > 0) return { width, left: -m.actualBoundingBoxLeft };
  }
  return { width: el.getBoundingClientRect().width, left: 0 };
}

/**
 * A single line of text sized so its visible letters span exactly the width of
 * the container, from the left edge to the right edge. Re-fits on resize and once
 * web fonts have loaded (so it measures Manrope, not the fallback font).
 */
export function FitWordmark({ text, className = "" }: { text: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);

  useLayoutEffect(() => {
    const container = box.current;
    const measure = probe.current;
    if (!container || !measure) return;

    const run = () => {
      const ink = measureInk(measure, text);
      if (ink.width <= 0) return;
      const size = (PROBE * container.clientWidth) / ink.width;
      setFit({ size, shift: (-ink.left * size) / PROBE });
    };
    run();
    const observer = new ResizeObserver(run);
    observer.observe(container);
    let alive = true;
    void document.fonts?.ready.then(() => alive && run());
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [text]);

  return (
    // overflow-hidden: the text's advance box is a little wider than its ink, and
    // the font's descent area is taller than the 0.85 line box; neither should scroll.
    <div ref={box} aria-hidden="true" className={`relative w-full overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute left-0 top-0 h-0 w-0 overflow-hidden">
        <span ref={probe} className="invisible whitespace-nowrap font-bold tracking-[-0.04em]" style={{ fontSize: PROBE }}>
          {text}
        </span>
      </div>
      <p
        className="whitespace-nowrap pb-[0.2em] font-bold leading-[0.85] tracking-[-0.04em]"
        // Before the first measurement, a width-based guess avoids a layout jump.
        style={{ fontSize: fit?.size ?? "21vw", marginLeft: fit?.shift ?? 0 }}
      >
        {text}
      </p>
    </div>
  );
}
