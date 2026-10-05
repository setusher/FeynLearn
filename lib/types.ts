// Data model (BUILD_SPEC section 5), with a few optional fields added where
// later phases need them. All records live in IndexedDB via lib/db.ts.

export type ConceptStatus = "solid" | "shaky" | "missing";

export type Topic = {
  id: string;
  name: string;
  createdAt: number;
  noteId?: string;
  nextReview?: number;
  intervalDays: number;
  ease: number;
  latestScore?: number;
  /** Last revisit angle used, so the next revisit can rotate to a different one. */
  lastAngle?: RevisitAngle;
};

export type Concept = {
  id: string;
  label: string;
  status: ConceptStatus;
  evidence: string;
  note: string;
  dependsOn: string[];
};

export type Misconception = { name: string; correction: string };

export type Message = {
  role: "user" | "ai";
  text: string;
  misconception?: Misconception;
};

export type Difficulty = "obvious" | "moderate" | "subtle";

export type ReverseParagraph = {
  text: string;
  hasError: boolean;
  errorNote?: string;
  correctFact?: string;
  /** Gap map concept this planted error relates to, when the topic has a map. */
  conceptId?: string;
};

export type Verdict = "caught" | "partly" | "missed";

export type ReverseResult = {
  difficulty: Difficulty;
  paragraphs: ReverseParagraph[];
  flags: { index: number; reason: string }[];
  verdicts?: { index: number; verdict: Verdict; correctFact: string; judgement: string }[];
  falseAlarms?: { index: number; note: string }[];
  /** 0-100: share of planted errors caught (partly = half), minus false alarms. */
  score?: number;
};

export type Session = {
  id: string;
  topicId: string;
  mode: "explain" | "reverse";
  persona?: string;
  startedAt: number;
  endedAt?: number;
  messages: Message[];
  concepts?: Concept[];
  score?: number;
  reverse?: ReverseResult;
  /** Analysis output for explain sessions. */
  summary?: string;
  misconceptions?: Misconception[];
  coverage?: number;
  accuracy?: number;
  /** Optional concept the session was focused on (from the Gap map). */
  focus?: string;
  /** Revisit angle for explain sessions: explain through an analogy. */
  angle?: "analogy";
};

export type RubricItem = { criterion: string; score: 0 | 1 | 2; feedback: string };

export type Challenge = {
  id: string;
  topicId: string;
  scenario: string;
  answer?: string;
  rubric?: RubricItem[];
  modelAnswer?: string;
  createdAt: number;
};

export type Note = { id: string; title: string; text: string; createdAt: number };

export type RevisitAngle = "persona" | "analogy" | "apply" | "reverse";

export type Mode = "explain" | "reverse";
