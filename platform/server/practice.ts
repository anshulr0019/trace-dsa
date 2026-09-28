import { problemById } from "../lib/curriculum/catalog";
import {
  lessons,
  matchesAnswer,
} from "../lib/curriculum/learning";
import { practiceCases } from "../lib/practice/cases";
import { type Language } from "../lib/curriculum/playground";
import type {
  PracticeRun,
  Proposal,
  Review,
} from "../lib/practice/types";
import answers from "./practice-answers.json";
import { aiReview, type AIConfig } from "./review";

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
export { referenceCode, suite, gradeSolution } from "../lib/practice/evaluate";
import { referenceCode, gradeSolution } from "../lib/practice/evaluate";
export async function handlePractice(
  raw: unknown,
  execute: Executor,
  config: AIConfig = {},
  signal?: AbortSignal,
) {
  const r = raw as PracticeRequest;
  if (
    !r ||
    !Object.hasOwn(problemById, r.problemId) ||
    !["python", "javascript", "cpp"].includes(r.language) ||
    !["predict", "grade", "review", "optimize"].includes(r.action)
  )
    throw Error("Choose a valid problem, language, and practice action.");
  const p = problemById[r.problemId];
  if (r.action === "predict") {
    const c = practiceCases(p).find((c) => c.id === r.caseId);
    if (!c) throw Error("Choose a practice example.");
    const expected = (answers as Record<string, unknown>)[c.id];
    let passed = false;
    try {
      passed = matchesAnswer(p, c.input, expected, r.answer);
    } catch {}
    return {
      passed,
      expected,
      explanation: passed
        ? lessons[p.id].why
        : `Try again using this idea: ${lessons[p.id].idea}`,
    };
  }
  if (typeof r.code !== "string" || !r.code.trim() || r.code.length > 60_000)
    throw Error("Write a solution of at most 60,000 characters first.");
  const grade = await gradeSolution(p.id, r.language, r.code, execute, signal);
  if (r.action === "grade") return grade;
  if (r.action === "review") {
    if (!config.apiKey || !config.model)
      throw Error(
        "AI review is not connected yet. Test-based ratings, hints, and reference comparisons are available.",
      );
    return {
      grade,
      review: await aiReview(
        p,
        r.language,
        r.code,
        grade,
        "review",
        config,
        signal,
      ),
    };
  }
  let review: Review | undefined;
  if (config.apiKey && config.model)
    review = await aiReview(
      p,
      r.language,
      r.code,
      grade,
      "optimize",
      config,
      signal,
    );
  // An explicit "no change needed" review must not silently replace the user's code.
  if (review && !review.code?.trim())
    return { grade, review, unchanged: true as const };
  const code = review?.code?.trim() || referenceCode(p.id, r.language);
  const checked = await gradeSolution(p.id, r.language, code, execute, signal);
  if (checked.passed !== checked.total)
    throw Error(
      "The suggested solution did not pass the test suite. Your code is unchanged; no replacement is offered.",
    );
  const proposal: Proposal = {
    source: review?.code ? "ai" : "reference",
    code,
    grade: checked,
    originalGrade: grade,
    improved: checked.passed > grade.passed,
    review,
    explanation:
      review?.summary ??
      (grade.passed === grade.total
        ? "Your solution passes this suite. Compare its approach with this verified reference; the test results alone do not establish a speed improvement."
        : `This reference passes the same eight cases. ${lessons[p.id].idea}`),
  };
  return proposal;
}
