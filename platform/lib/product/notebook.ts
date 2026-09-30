import { problemById } from "../curriculum/catalog";
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
    if (
      /^(trace:note:|trace:problem:|trace:practice:|trace:curriculum:complete$|trace:language$)/.test(
        key,
      )
    )
      data[key] = localStorage.getItem(key)!;
  }
  return data;
}
export function restoreNotebook(data: Record<string, string>) {
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    JSON.stringify(data).length > 4000000
  )
    throw Error("Invalid notebook backup.");
  const entries = Object.entries(data).filter(([key]) =>
    /^(trace:note:|trace:problem:|trace:practice:|trace:curriculum:complete$|trace:language$)/.test(
      key,
    ),
  );
  for (const [key, value] of entries) {
    if (typeof value !== "string" || value.length > 250000)
      throw Error("Invalid notebook values.");
    const languages = ["python", "cpp", "java", "javascript"],
      levels = ["guided", "independent", "challenge"];
    if (key === "trace:language") {
      if (!languages.includes(value)) throw Error("Invalid saved language.");
      continue;
    }
    if (key.startsWith("trace:practice:level:")) {
      if (!levels.includes(value)) throw Error("Invalid saved practice level.");
      continue;
    }
    const parsed = JSON.parse(value);
    if (key === "trace:curriculum:complete") {
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
          (v) => typeof v !== "string" || v.length > 18000,
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
}
