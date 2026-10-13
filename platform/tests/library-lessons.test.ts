import test from "node:test";
import assert from "node:assert/strict";
import {
  libraryLessons,
  libraryLessonById,
  languageTracks,
  defaultLibraryInput,
} from "../lib/languages/catalog";
import {
  libraryCases,
  validateLibraryInput,
  sameLibraryOutput,
  expectedLibraryOutput,
} from "../lib/languages/exercises";
import {
  defaultLibraryDraft,
  validLibraryDraft,
} from "../lib/languages/storage";
import { problemById } from "../lib/curriculum/catalog";
import { notebookSnapshot, restoreNotebook } from "../lib/product/notebook";
const memory = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    get length() {
      return memory.size;
    },
    key: (i: number) => [...memory.keys()][i],
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => memory.set(k, v),
    removeItem: (k: string) => memory.delete(k),
  },
  window: { dispatchEvent: () => true },
});
test("every lesson has a valid prerequisite, a real DSA destination, and bounded cases", () => {
  assert.equal(libraryLessons.length, 48);
  for (const t of languageTracks)
    assert.equal(libraryLessons.filter((l) => l.language === t.id).length, 12);
  for (const l of libraryLessons) {
    assert.ok(problemById[l.problem], `${l.id}: ${l.problem}`);
    for (const id of l.prerequisites)
      assert.equal(libraryLessonById[id].language, l.language);
    for (const c of libraryCases)
      assert.equal(validateLibraryInput(`library:${l.id}`, c.input), null);
  }
});
test("library inputs reject unknown lessons, excess data, malformed types, and unsupported text", () => {
  for (const id of [
    "library:__proto__",
    "library:constructor",
    "library:missing",
  ])
    assert.ok(validateLibraryInput(id, defaultLibraryInput));
  for (const input of [
    { ...defaultLibraryInput, nums: [1.5] },
    { ...defaultLibraryInput, nums: Array(33).fill(1) },
    { ...defaultLibraryInput, text: "é" },
    { ...defaultLibraryInput, value: "1" },
    { ...defaultLibraryInput, target: Infinity },
    { ...defaultLibraryInput, extra: true },
  ])
    assert.ok(validateLibraryInput("library:cpp-sequence", input));
});
test("grading distinguishes ordered sequences from sets, empty values, and wrong object shapes", () => {
  assert.equal(sameLibraryOutput([1, 2], [2, 1]), false);
  assert.equal(sameLibraryOutput({}, []), false);
  assert.equal(sameLibraryOutput(null, []), false);
  assert.equal(sameLibraryOutput({ a: 1, b: 2 }, { b: 2, a: 1 }), true);
  assert.deepEqual(
    expectedLibraryOutput("search", {
      ...defaultLibraryInput,
      nums: [2, 2, 2, 10],
      target: 2,
    }),
    0,
  );
  assert.deepEqual(
    expectedLibraryOutput("search", {
      ...defaultLibraryInput,
      nums: [],
      target: 2,
    }),
    0,
  );
});
test("language drafts round-trip in backups and invalid drafts cannot overwrite saved code", () => {
  memory.clear();
  const key = "trace:language-study:cpp-sequence",
    draft = {
      ...defaultLibraryDraft("cpp-sequence"),
      solution: "my saved code",
      assisted: true,
    };
  memory.set(key, JSON.stringify(draft));
  memory.set("sb-session-token", "secret");
  const snapshot = notebookSnapshot();
  assert.equal(snapshot["sb-session-token"], undefined);
  memory.clear();
  restoreNotebook(snapshot);
  assert.deepEqual(JSON.parse(memory.get(key)!), draft);
  for (const invalid of [
    { ...draft, assisted: "true" },
    { ...draft, solution: "x".repeat(60001) },
  ]) {
    assert.equal(validLibraryDraft("cpp-sequence", invalid), false);
    assert.throws(() =>
      restoreNotebook({
        "trace:sql-draft": "SELECT 9",
        [key]: JSON.stringify(invalid),
      }),
    );
    assert.equal(memory.get("trace:sql-draft"), undefined);
    assert.deepEqual(JSON.parse(memory.get(key)!), draft);
  }
  assert.equal(validLibraryDraft("__proto__", draft), false);
});
