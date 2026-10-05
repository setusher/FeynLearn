"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Web Speech API helpers. Both features are feature-detected: the mic button and
// the read-aloud toggle are hidden when the browser does not support them.

// Minimal typings; SpeechRecognition is not in the TypeScript DOM lib.
type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
type RecognitionEvent = { resultIndex: number; results: RecognitionResultList };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noop = () => () => {};

/** True only on the client when `test` passes; false during server render. */
function useClientSupport(test: () => boolean): boolean {
  return useSyncExternalStore(noop, test, () => false);
}

export function useSpeechInput(onText: (finalText: string, interim: string) => void) {
  const supported = useClientSupport(() => recognitionCtor() !== undefined);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<Recognition | null>(null);
  const finalText = useRef("");
  const cb = useRef(onText);
  useEffect(() => {
    cb.current = onText;
  }, [onText]);

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    setError("");
    finalText.current = "";
    const r = new Ctor();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText.current += res[0].transcript;
        else interim += res[0].transcript;
      }
      cb.current(finalText.current, interim);
    };
    r.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone access was blocked. Allow it in your browser to use voice."
          : e.error === "no-speech"
            ? "No speech heard. Try again."
            : "Voice input stopped. Try again.",
      );
    };
    r.onend = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }, []);

  useEffect(() => () => rec.current?.stop(), []);

  return { supported, listening, error, start, stop };
}

const READ_ALOUD_KEY = "feynlearn.readAloud";

/** Optional read-aloud for learner replies. The preference is remembered per browser. */
export function useReadAloud() {
  const supported = useClientSupport(() => "speechSynthesis" in window);
  const [enabled, setEnabledState] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(READ_ALOUD_KEY) === "1";
    } catch {
      return false;
    }
  });

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    try {
      window.localStorage.setItem(READ_ALOUD_KEY, on ? "1" : "0");
    } catch {
      // Storage can be unavailable (private mode); the toggle still works for this visit.
    }
    if (!on && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    },
    [enabled],
  );

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { supported, enabled: supported && enabled, setEnabled, speak };
}
