import { problemById } from "../curriculum/catalog";
import { lessons as foundationLessons, validateInput } from "../lessons";
import { modules } from "../computer-science/catalog";
import { validArchitecture } from "../computer-science/architecture";
export const notebookEntry =
  /^(trace:note:|trace:problem:|trace:practice:|trace:study:|trace:course-study:|trace:capstone:|trace:solving-plan:|trace:mastery:|trace:manipulate:|trace:sql-draft$|trace:sql-context$|trace:foundation-drafts$|trace:foundation-inputs$|trace-computer-science-v1$|trace:curriculum:complete$|trace:language$|trace-progress-v1$)/;
export type Note = {
  bookmarked: boolean;
  revision: boolean;
  notes: string;
  updatedAt: string;
};
export const noteKey = (id: string) => `trace:note:${id}`;
export const emptyNote: Note = {
  bookmarked: false,
  revision: false,
  notes: "",
  updatedAt: "",
};
export function readNote(id: string): Note {
  try {
    const v = JSON.parse(localStorage.getItem(noteKey(id)) ?? "{}");
    return {
      bookmarked: v?.bookmarked === true,
      revision: v?.revision === true,
      notes: typeof v?.notes === "string" ? v.notes.slice(0, 8000) : "",
      updatedAt: typeof v?.updatedAt === "string" ? v.updatedAt : "",
    };
  } catch {
    return { ...emptyNote };
  }
}
export function saveNote(id: string, note: Note) {
  localStorage.setItem(
    noteKey(id),
    JSON.stringify({ ...note, updatedAt: new Date().toISOString() }),
  );
  window.dispatchEvent(new Event("trace:notebook"));
}
export function notebookSnapshot() {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (notebookEntry.test(key)) data[key] = localStorage.getItem(key)!;
  }
  return data;
}
export function restoreNotebook(data: Record<string, string>) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    new TextEncoder().encode(JSON.stringify(data)).length > 4000000
  )
    throw Error("Invalid notebook backup.");
  const entries = Object.entries(data).filter(([key]) =>
    notebookEntry.test(key),
  );
  for (const [key, value] of entries) {
    if (typeof value !== "string" || value.length > 1500000)
      throw Error("Invalid notebook values.");
    const languages = ["python", "cpp", "java", "javascript"],
      levels = ["guided", "independent", "challenge"];
    if (key.startsWith("trace:solving-plan:") || key === "trace:sql-draft") {
      if (value.length > 6000) throw Error("Saved response is too long.");
      continue;
    }
    if (key === "trace:language") {
      if (!languages.includes(value)) throw Error("Invalid saved language.");
      continue;
    }
    if (key.startsWith("trace:practice:level:")) {
      if (!levels.includes(value)) throw Error("Invalid saved practice level.");
      continue;
    }
    const parsed = JSON.parse(value);
    const strings = (v: unknown, max: number) =>
      Array.isArray(v) &&
      v.every((x) => typeof x === "string" && x.length <= max);
    const checks = (v: unknown, max: number) =>
      Array.isArray(v) &&
      v.every((x) => Number.isInteger(x) && x >= 0 && x < max);
    if (key === "trace:sql-context") {
      if (
        !parsed ||
        !Number.isInteger(parsed.task) ||
        parsed.task < 0 ||
        parsed.task > 2 ||
        typeof parsed.support !== "boolean"
      )
        throw Error("Invalid SQL session.");
    } else if (key.startsWith("trace:course-study:")) {
      if (
        !parsed ||
        typeof parsed.answer !== "string" ||
        parsed.answer.length > 6000 ||
        !checks(parsed.checks, 3)
      )
        throw Error("Invalid lesson response.");
    } else if (key.startsWith("trace:capstone:")) {
      if (
        !parsed ||
        !strings(parsed.notes, 10000) ||
        parsed.notes.length !== 3 ||
        !checks(parsed.checks, 4)
      )
        throw Error("Invalid project notes.");
    } else if (key === "trace:foundation-inputs") {
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw Error("Invalid foundation inputs.");
      for (const [id, v] of Object.entries(parsed) as [string, any][]) {
        const lesson = foundationLessons.find((l) => l.id === id);
        if (
          !lesson ||
          !v ||
          !Array.isArray(v.nums) ||
          !Number.isFinite(v.parameter)
        )
          throw Error("Invalid foundation input.");
        validateInput(lesson, v.nums.join(","), String(v.parameter));
      }
    } else if (key === "trace:foundation-drafts") {
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        Object.values(parsed).some(
          (v) =>
            !v ||
            typeof v !== "object" ||
            Array.isArray(v) ||
            Object.entries(v).some(
              ([l, code]) =>
                !languages.includes(l) ||
                typeof code !== "string" ||
                code.length > 60000,
            ),
        )
      )
        throw Error("Invalid foundation drafts.");
    } else if (key === "trace-computer-science-v1") {
      if (
        !parsed ||
        !strings(parsed.completed, 100) ||
        parsed.completed.some(
          (id: string) => !modules.some((m) => m.id === id),
        ) ||
        !parsed.notes ||
        typeof parsed.notes !== "object" ||
        Object.values(parsed.notes).some(
          (v) => typeof v !== "string" || v.length > 10000,
        ) ||
        !parsed.scenarios ||
        typeof parsed.scenarios !== "object" ||
        Object.values(parsed.scenarios).some(
          (v: any) =>
            !v ||
            !validArchitecture(v.architecture) ||
            !v.settings ||
            typeof v.settings !== "object",
        ) ||
        !parsed.drafts ||
        typeof parsed.drafts !== "object" ||
        Object.values(parsed.drafts).some(
          (v: any) =>
            !v ||
            typeof v.text !== "string" ||
            v.text.length > 20000 ||
            !checks(v.checks, 4),
        )
      )
        throw Error("Invalid computer science study work.");
    } else if (key.startsWith("trace:mastery:")) {
      if (
        !Array.isArray(parsed) ||
        parsed.length > 40 ||
        parsed.some(
          (v) =>
            !v ||
            ![
              "watched",
              "exercise",
              "assisted",
              "independent",
              "self-review",
            ].includes(v.kind) ||
            typeof v.at !== "string" ||
            !Number.isFinite(Date.parse(v.at)) ||
            typeof v.detail !== "string" ||
            v.detail.length > 200,
        )
      )
        throw Error("Invalid learning evidence.");
    } else if (key.startsWith("trace:manipulate:")) {
      if (
        !parsed ||
        !Array.isArray(parsed.answers) ||
        parsed.answers.length > 20 ||
        parsed.answers.some((x: unknown) => !Number.isInteger(x)) ||
        !Number.isInteger(parsed.step)
      )
        throw Error("Invalid visual exercise.");
    } else if (key === "trace-progress-v1") {
      const ids = [
        "two-sum",
        "binary-search",
        "sliding-window",
        "bubble-sort",
        "insertion-sort",
        "prefix-sum",
      ];
      if (
        !parsed ||
        !Array.isArray(parsed.mastered) ||
        parsed.mastered.some(
          (id: unknown) => typeof id !== "string" || !ids.includes(id),
        ) ||
        typeof parsed.attempts !== "number" ||
        !parsed.answered ||
        typeof parsed.answered !== "object" ||
        Array.isArray(parsed.answered) ||
        Object.values(parsed.answered).some(
          (v) =>
            !Array.isArray(v) ||
            v.some((n) => !Number.isInteger(n) || n < 0 || n > 100),
        ) ||
        typeof parsed.lastLesson !== "string" ||
        !ids.includes(parsed.lastLesson)
      )
        throw Error("Invalid foundation progress.");
    } else if (key === "trace:curriculum:complete") {
      if (
        !Array.isArray(parsed) ||
        parsed.some((id) => typeof id !== "string" || !problemById[id])
      )
        throw Error("Invalid understood problem list.");
    } else if (key.startsWith("trace:note:")) {
      if (
        !parsed ||
        typeof parsed.notes !== "string" ||
        parsed.notes.length > 8000 ||
        typeof parsed.bookmarked !== "boolean" ||
        typeof parsed.revision !== "boolean"
      )
        throw Error("Invalid problem notes.");
    } else if (key.startsWith("trace:problem:")) {
      if (
        !parsed ||
        !languages.includes(parsed.language) ||
        typeof parsed.input !== "string" ||
        !parsed.drafts ||
        typeof parsed.drafts !== "object" ||
        Array.isArray(parsed.drafts) ||
        Object.values(parsed.drafts).some(
          (v) => typeof v !== "string" || v.length > 60000,
        )
      )
        throw Error("Invalid editor draft.");
    } else if (key.startsWith("trace:practice:attempts:")) {
      if (
        !Array.isArray(parsed) ||
        parsed.some(
          (a) =>
            !a ||
            typeof a.id !== "string" ||
            typeof a.at !== "string" ||
            typeof a.caseId !== "string" ||
            !languages.includes(a.language) ||
            !levels.includes(a.level) ||
            typeof a.score !== "number" ||
            a.score < 0 ||
            a.score > 100 ||
            typeof a.passed !== "number" ||
            typeof a.total !== "number" ||
            typeof a.explanation !== "string",
        )
      )
        throw Error("Invalid practice history.");
    } else if (key.startsWith("trace:practice:draft:")) {
      if (
        !parsed ||
        typeof parsed.code !== "string" ||
        !Number.isInteger(parsed.caseIndex) ||
        typeof parsed.explanation !== "string"
      )
        throw Error("Invalid practice draft.");
    } else if (key.startsWith("trace:study:review:")) {
      if (
        !parsed ||
        typeof parsed.date !== "string" ||
        (parsed.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date))
      )
        throw Error("Invalid revision date.");
    } else if (
      key === "trace:study:experiments" ||
      key.startsWith("trace:study:versions:") ||
      key.startsWith("trace:study:mistakes:")
    ) {
      if (
        !Array.isArray(parsed) ||
        parsed.length > 40 ||
        parsed.some(
          (v) =>
            !v ||
            typeof v.id !== "string" ||
            typeof v.createdAt !== "string" ||
            !problemById[v.problemId] ||
            !languages.includes(v.language) ||
            typeof v.code !== "string" ||
            v.code.length > 60000 ||
            !v.input ||
            typeof v.input !== "object" ||
            Array.isArray(v.input),
        )
      )
        throw Error("Invalid saved study work.");
      if (key.startsWith("trace:study:mistakes:")) {
        if (
          parsed.some(
            (v) =>
              typeof v.note !== "string" ||
              (v.error !== null && typeof v.error !== "string"),
          )
        )
          throw Error("Invalid mistake journal.");
      } else if (
        parsed.some(
          (v) =>
            typeof v.title !== "string" ||
            v.title.length > 120 ||
            typeof v.description !== "string" ||
            v.description.length > 2000,
        )
      )
        throw Error("Invalid custom problem or code version.");
    } else throw Error("Unsupported notebook entry.");
  }
  const previous = entries.map(
    ([key]) => [key, localStorage.getItem(key)] as const,
  );
  try {
    for (const [key, value] of entries) localStorage.setItem(key, value);
  } catch {
    for (const [key, value] of previous) {
      try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      } catch {}
    }
    throw Error("Not enough browser storage to restore this notebook.");
  }
  window.dispatchEvent(new Event("trace:notebook"));
  window.dispatchEvent(new Event("trace:restore"));
}
