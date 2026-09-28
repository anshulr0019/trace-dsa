import { problemById } from "../curriculum/catalog";
import {
  examplesFor,
  lessons,
  matchesAnswer,
} from "../curriculum/learning";
import { practiceCases } from "./cases";
import { pythonPrelude, pythonSources } from "../curriculum/sources";
import { playgroundSource, type Language } from "../curriculum/playground";
import type {
  Grade,
  PracticeRun,
} from "./types";
import answers from "../../server/practice-answers.json";

export type Executor = (
  payload: {
    language: string;
    code: string;
    input: Record<string, unknown>;
    problemId: string;
    automatic?: boolean;
  },
  signal?: AbortSignal,
) => Promise<PracticeRun>;
export type PracticeRequest = {
  action: "predict" | "grade" | "review" | "optimize";
  problemId: string;
  language: Language;
  code?: string;
  caseId?: string;
  answer?: unknown;
  explanation?: string;
};
export function referenceCode(id: string, language: Language) {
  return language === "python"
    ? pythonPrelude + pythonSources[id]
    : playgroundSource(problemById[id], language);
}
export function suite(id: string) {
  const p = problemById[id];
  return [
    ...examplesFor(p).map((c, i) => ({ ...c, id: `worked:${i}` })),
    ...practiceCases(p).map((c) => ({
      ...c,
      expected: (answers as Record<string, unknown>)[c.id],
    })),
  ];
}
export async function gradeSolution(
  id: string,
  language: Language,
  code: string,
  execute: Executor,
  signal?: AbortSignal,
): Promise<Grade> {
  const p = problemById[id],
    cases = [];
  for (const c of suite(id)) {
    signal?.throwIfAborted();
    const run = await execute(
      { language, code, input: c.input, problemId: id, automatic: false },
      signal,
    );
    if (
      run.error &&
      /sandbox_apply|unavailable|not configured|Local access only/i.test(
        run.error,
      )
    )
      throw Error(
        "Code execution is unavailable. Your attempt has not been rated.",
      );
    let passed = false;
    try {
      passed = !run.error && matchesAnswer(p, c.input, c.expected, run.result);
    } catch {
      /* A malformed answer fails this case, not the whole submission. */
    }
    cases.push({
      id: c.id,
      label: c.label,
      input: c.input,
      expected: c.expected,
      actual: run.result,
      passed,
      error: run.error,
    });
  }
  signal?.throwIfAborted();
  const passed = cases.filter((c) => c.passed).length,
    total = cases.length;
  return {
    runId: crypto.randomUUID(),
    score: Math.round((passed / total) * 100),
    passed,
    total,
    cases,
    feedback:
      passed === total
        ? "All eight cases passed. Explain why your approach works, then try the challenge without hints."
        : `${total - passed} case${total - passed === 1 ? " needs" : "s need"} attention. Start with the first failing input and inspect the first decision where your result diverges.`,
    referenceCost: lessons[id].cost,
  };
}
