import { create } from "zustand";
import type { PersonaId } from "./personas";
import type { Difficulty, Mode } from "./types";

// UI/session state that does not need to survive a refresh.
// Anything that must persist goes to IndexedDB (lib/db.ts).
type UIState = {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;

  /** The topic currently in focus, shown in the top bar. */
  currentTopic: string;
  setCurrentTopic: (name: string) => void;

  draftMode: Mode;
  setDraftMode: (mode: Mode) => void;
  draftPersona: PersonaId;
  setDraftPersona: (persona: PersonaId) => void;
  draftDifficulty: Difficulty;
  setDraftDifficulty: (difficulty: Difficulty) => void;
};

export const useUI = create<UIState>((set) => ({
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
  currentTopic: "",
  setCurrentTopic: (currentTopic) => set({ currentTopic }),
  draftMode: "explain",
  setDraftMode: (draftMode) => set({ draftMode }),
  draftPersona: "child",
  setDraftPersona: (draftPersona) => set({ draftPersona }),
  draftDifficulty: "moderate",
  setDraftDifficulty: (draftDifficulty) => set({ draftDifficulty }),
}));
