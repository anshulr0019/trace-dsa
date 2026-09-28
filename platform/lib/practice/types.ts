import type { PracticeLevel } from "./cases";
import type { Language } from "../curriculum/playground";
import type { ExecutionFrame } from "../../components/curriculum/scene";

export type CaseResult = {
  id: string;
  label: string;
  input: Record<string, unknown>;
  expected: unknown;
  actual: unknown;
  passed: boolean;
  error?: string | null;
};
export type Grade = {
  runId: string;
  score: number;
  passed: number;
  total: number;
  cases: CaseResult[];
  feedback: string;
  referenceCost: string;
};
export type Review = {
  source: "ai";
  summary: string;
  time: string;
  space: string;
  suggestions: string[];
  code: string | null;
};
export type Proposal = {
  source: "reference" | "ai";
  code: string;
  explanation: string;
  grade: Grade;
  originalGrade: Grade;
  improved: boolean;
  review?: Review;
};
export type Attempt = {
  id: string;
  at: string;
  level: PracticeLevel;
  caseId: string;
  language: Language;
  score: number;
  passed: number;
  total: number;
  assisted: boolean;
  explanation: string;
};
export type PracticeRun = {
  frames: ExecutionFrame[];
  result: unknown;
  error?: string | null;
  stdout?: string;
  truncated?: boolean;
};

export function confidence(attempts: Attempt[]) {
  const independent = attempts.filter(
    (a) =>
      !a.assisted &&
      a.passed === a.total &&
      a.total > 0 &&
      a.level !== "guided",
  );
  const solved = new Set(independent.map((a) => a.caseId));
  const challenged = independent.some(
    (a) => a.level === "challenge" && a.explanation.trim().length >= 20,
  );
  if (solved.size >= 2 && challenged)
    return {
      label: "Confident",
      description:
        "Two different exercises solved without hints, including a challenge with your explanation.",
      value: 100,
    };
  if (attempts.some((a) => a.passed === a.total && a.total > 0))
    return {
      label: "Practicing",
      description:
        "You have a successful attempt. Solve two different exercises independently, including a challenge, to build confidence.",
      value: 55,
    };
  return {
    label: "Learning",
    description: "Start with a prediction, then solve a fresh case yourself.",
    value: 15,
  };
}
