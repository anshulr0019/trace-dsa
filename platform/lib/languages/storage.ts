import { libraryLessonById, defaultLibraryInput } from "./catalog";
import { librarySource } from "./sources";
export type LibraryDraft = {
  example: string;
  solution: string;
  inputText: string;
  assisted: boolean;
};
export const libraryDraftKey = (id: string) => `trace:language-study:${id}`;
export function validLibraryDraft(
  id: string,
  value: unknown,
): value is LibraryDraft {
  if (
    !Object.hasOwn(libraryLessonById, id) ||
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  )
    return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).every((k) =>
      ["example", "solution", "inputText", "assisted"].includes(k),
    ) &&
    typeof v.example === "string" &&
    v.example.length <= 60000 &&
    typeof v.solution === "string" &&
    v.solution.length <= 60000 &&
    typeof v.inputText === "string" &&
    v.inputText.length <= 8000 &&
    typeof v.assisted === "boolean"
  );
}
export function defaultLibraryDraft(id: string): LibraryDraft {
  const l = libraryLessonById[id];
  return {
    example: l.source,
    solution: librarySource(l.language, l.topic, true),
    inputText: JSON.stringify(defaultLibraryInput, null, 2),
    assisted: false,
  };
}
export function readLibraryDraft(id: string): LibraryDraft {
  try {
    const value = JSON.parse(
      localStorage.getItem(libraryDraftKey(id)) ?? "null",
    );
    if (validLibraryDraft(id, value)) return value;
  } catch {}
  return defaultLibraryDraft(id);
}
export function saveLibraryDraft(id: string, value: LibraryDraft): boolean {
  if (!validLibraryDraft(id, value)) throw Error("Invalid language draft.");
  try {
    localStorage.setItem(libraryDraftKey(id), JSON.stringify(value));
    window.dispatchEvent(new Event("trace:notebook"));
    return true;
  } catch {
    return false;
  }
}
