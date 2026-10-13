import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultPreferences,
  preferencesKey,
} from "../lib/experience/preferences";
import {
  clearLearningProgress,
  notebookSnapshot,
  restoreNotebook,
} from "../lib/product/notebook";
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
test("clearing learning progress preserves notes, code, preferences, and authentication", () => {
  memory.clear();
  const study = {
    completed: ["queues"],
    notes: { queues: "keep" },
    scenarios: { demo: {} },
    drafts: { queues: { text: "my answer" } },
  };
  memory.set("trace-computer-science-v1", JSON.stringify(study));
  const preserved = {
    "trace:sql-draft": "SELECT 1",
    "trace:note:two-sum": "my notes",
    [preferencesKey]: JSON.stringify(defaultPreferences),
    "sb-session-token": "private",
  };
  for (const [key, value] of Object.entries(preserved)) memory.set(key, value);
  for (const key of [
    "trace-progress-v1",
    "trace:mastery:two-sum",
    "trace:curriculum:complete",
    "trace:practice:attempts:two-sum",
  ])
    memory.set(key, "[]");
  clearLearningProgress();
  assert.deepEqual(JSON.parse(memory.get("trace-computer-science-v1")!), {
    ...study,
    completed: [],
  });
  for (const [key, value] of Object.entries(preserved))
    assert.equal(memory.get(key), value);
  assert.equal(memory.has("trace-progress-v1"), false);
  assert.equal(memory.has("trace:mastery:two-sum"), false);
  assert.equal(memory.has("trace:curriculum:complete"), false);
  assert.equal(memory.has("trace:practice:attempts:two-sum"), false);
});
test("a notebook backup retains valid preferences and theme while excluding authentication", () => {
  memory.clear();
  const saved = {
    ...defaultPreferences,
    language: "java",
    speed: 2,
    wordWrap: true,
  };
  memory.set(preferencesKey, JSON.stringify(saved));
  memory.set("trace:theme", "light");
  memory.set("sb-session-token", "private");
  const snapshot = notebookSnapshot();
  assert.equal(snapshot["sb-session-token"], undefined);
  memory.clear();
  restoreNotebook(snapshot);
  assert.deepEqual(JSON.parse(memory.get(preferencesKey)!), saved);
  assert.equal(memory.get("trace:theme"), "light");
});
test("invalid preference or theme backups cannot partially overwrite code or existing preferences", () => {
  memory.clear();
  memory.set("trace:sql-draft", "SELECT 1");
  memory.set(preferencesKey, JSON.stringify(defaultPreferences));
  for (const bad of [
    { ...defaultPreferences, speed: 99 },
    { ...defaultPreferences, wordWrap: "true" },
    { ...defaultPreferences, language: "rust" },
    { ...defaultPreferences, editorSize: -1 },
    { ...defaultPreferences, startPage: "owner" },
  ]) {
    assert.throws(() =>
      restoreNotebook({
        "trace:sql-draft": "SELECT 2",
        [preferencesKey]: JSON.stringify(bad),
      }),
    );
    assert.equal(memory.get("trace:sql-draft"), "SELECT 1");
    assert.deepEqual(
      JSON.parse(memory.get(preferencesKey)!),
      defaultPreferences,
    );
  }
  assert.throws(() =>
    restoreNotebook({
      "trace:sql-draft": "SELECT 2",
      "trace:theme": "invalid",
    }),
  );
  assert.equal(memory.get("trace:sql-draft"), "SELECT 1");
});
