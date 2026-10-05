import { problemById } from "../curriculum/catalog";
import { validateProblemInput } from "../curriculum/validate";
import type { Language } from "../curriculum/playground";
export type SharedLesson = {
  version: 1;
  problemId: string;
  title: string;
  instructions: string;
  input: Record<string, unknown>;
  language: Language;
  code?: string;
  step?: number;
};
export function readSharedLesson(hash = location.hash): SharedLesson | null {
  if (!hash.startsWith("#lesson=")) return null;
  try {
    const bytes = Uint8Array.from(
      atob(decodeURIComponent(hash.slice(8))),
      (c) => c.charCodeAt(0),
    );
    if (bytes.length > 24000) throw Error("This lesson is too large.");
    const v = JSON.parse(new TextDecoder().decode(bytes));
    if (
      v.version !== 1 ||
      !problemById[v.problemId] ||
      validateProblemInput(v.problemId, v.input) ||
      !["python", "cpp", "java", "javascript"].includes(v.language) ||
      typeof v.title !== "string" ||
      v.title.length > 120 ||
      typeof v.instructions !== "string" ||
      v.instructions.length > 3000 ||
      (v.code !== undefined &&
        (typeof v.code !== "string" || v.code.length > 24000)) ||
      (v.step !== undefined &&
        (!Number.isInteger(v.step) || v.step < 0 || v.step > 1202))
    )
      throw Error("This lesson link is invalid.");
    return v;
  } catch {
    throw Error(
      "This lesson link could not be read. Open the original problem or ask the teacher for a new link.",
    );
  }
}
export function lessonURL(lesson: SharedLesson): string {
  if (
    !problemById[lesson.problemId] ||
    validateProblemInput(lesson.problemId, lesson.input)
  )
    throw Error("Use a valid problem input before sharing.");
  if (
    lesson.title.length > 120 ||
    lesson.instructions.length > 3000 ||
    (lesson.step !== undefined &&
      (!Number.isInteger(lesson.step) || lesson.step < 0 || lesson.step > 1202))
  )
    throw Error(
      "The lesson title, instructions or selected step is too large to share.",
    );
  const bytes = new TextEncoder().encode(JSON.stringify(lesson));
  if (bytes.length > 24000)
    throw Error(
      "The lesson is too large to share as a link. Shorten the code or instructions.",
    );
  const encoded = btoa(
    Array.from(bytes, (b) => String.fromCharCode(b)).join(""),
  );
  return `${location.origin}/?view=curriculum&problem=${encodeURIComponent(lesson.problemId)}&language=${lesson.language}#lesson=${encodeURIComponent(encoded)}`;
}
export function openProblem(id: string, extra = "") {
  location.assign(
    `/?view=curriculum&problem=${encodeURIComponent(id)}${extra}`,
  );
}
