import { problemById } from "../curriculum/catalog";
import { lessons, matchesAnswer } from "../curriculum/learning";
import { executeInBrowser } from "../curriculum/runtime-client";
import { practiceCases } from "./cases";
import { gradeSolution, referenceCode, type PracticeRequest } from "./evaluate";
import answers from "../../server/practice-answers.json";

/** Educational checks run on the device; these are not trusted account grades. */
export async function browserPractice(request: PracticeRequest, signal?: AbortSignal) {
  const p = problemById[request.problemId];
  if (request.action === "predict") {
    const c = practiceCases(p).find(c => c.id === request.caseId);
    if (!c) throw Error("Choose a practice example.");
    const expected = (answers as Record<string, unknown>)[c.id];
    let passed = false;
    try { passed = matchesAnswer(p, c.input, expected, request.answer); } catch {}
    return { passed, expected, explanation: passed ? lessons[p.id].why : `Try again using this idea: ${lessons[p.id].idea}` };
  }
  if (request.action === "review") throw Error("AI review needs a connected review service. Test-based checks and reference comparisons are available.");
  const grade = await gradeSolution(p.id, request.language, request.code ?? "", executeInBrowser, signal);
  if (request.action === "grade") return grade;
  const code = referenceCode(p.id, request.language);
  const checked = await gradeSolution(p.id, request.language, code, executeInBrowser, signal);
  if (checked.passed !== checked.total) throw Error("The reference did not pass the test suite. Your code is unchanged.");
  return { source: "reference", code, grade: checked, originalGrade: grade, improved: checked.passed > grade.passed, explanation: grade.passed === grade.total ? "Your solution passes this suite. Compare its approach with this verified reference; the tests alone do not establish a speed improvement." : `This reference passes the same eight cases. ${lessons[p.id].idea}` };
}
