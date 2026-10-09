import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { notebookSnapshot, restoreNotebook } from "../lib/product/notebook";
import { initialScenario } from "../lib/computer-science/examples";
import {
  learningEvidence,
  learningStatus,
  recordLearning,
  reviewDue,
} from "../lib/product/mastery";
import { sqlSetup, sqlTasks } from "../lib/learning/sql-project";
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
test("backup round-trips lesson answers, projects, language drafts and CS scenarios without including account sessions", () => {
  memory.clear();
  const entries = {
    "trace:course-study:foundation:binary-search": JSON.stringify({
      answer: "The invariant preserves target reachability.",
      checks: [0, 2],
    }),
    "trace:capstone:databases": JSON.stringify({
      notes: ["schema", "query", "concurrency"],
      checks: [0, 1],
    }),
    "trace:solving-plan:maximum-average-subarray":
      "Keep a fixed window and subtract the outgoing value.",
    "trace:foundation-drafts": JSON.stringify({
      "binary-search": { java: "public class Solution extends Trace {}" },
    }),
    "trace-computer-science-v1": JSON.stringify({
      completed: ["tcp-retries"],
      notes: { "tcp-retries": "Retry the missing segment." },
      scenarios: { "tcp-retries": initialScenario("tcp-retries") },
      drafts: {},
    }),
    "trace:foundation-inputs": JSON.stringify({
      "binary-search": { nums: [1, 3, 5], parameter: 3 },
    }),
    "trace:sql-context": JSON.stringify({ task: 0, support: true }),
    "trace:sql-draft": sqlTasks[0].solution,
  };
  for (const [k, v] of Object.entries(entries)) memory.set(k, v);
  memory.set("sb-session-token", "private");
  const snapshot = notebookSnapshot();
  assert.deepEqual(snapshot, entries);
  memory.clear();
  restoreNotebook(snapshot);
  assert.deepEqual(notebookSnapshot(), entries);
});
test("invalid project or progress backup cannot partially replace saved work", () => {
  memory.clear();
  memory.set("trace:sql-draft", "SELECT 1");
  assert.throws(() =>
    restoreNotebook({
      "trace:sql-draft": "SELECT 2",
      "trace:capstone:databases": JSON.stringify({
        notes: ["too few"],
        checks: [99],
      }),
    }),
  );
  assert.equal(memory.get("trace:sql-draft"), "SELECT 1");
  assert.throws(() =>
    restoreNotebook({
      "trace:mastery:x": JSON.stringify([
        { kind: "independent", at: "bad date", detail: "x" },
      ]),
    }),
  );
});
test("evidence distinguishes exploration, supported success and independent success; review uses the last successful attempt", () => {
  memory.clear();
  recordLearning("p", "watched", "Played");
  recordLearning("p", "watched", "Played again");
  assert.equal(learningEvidence("p").length, 1);
  assert.equal(learningStatus(learningEvidence("p")), "Explored");
  recordLearning("p", "assisted", "Hints");
  assert.equal(learningStatus(learningEvidence("p")), "Solved with support");
  recordLearning("p", "independent", "Eight checks");
  assert.equal(learningStatus(learningEvidence("p")), "Solved independently");
  const rows = [
    {
      kind: "independent" as const,
      at: "2026-10-01T00:00:00Z",
      detail: "passed",
    },
    { kind: "watched" as const, at: "2026-10-09T00:00:00Z", detail: "visit" },
  ];
  assert.equal(reviewDue(rows, Date.parse("2026-10-09T00:00:00Z")), true);
  assert.equal(reviewDue(rows, Date.parse("2026-10-02T00:00:00Z")), false);
});
test("all project SQL solutions execute and return the authored rows, including empty joins", () => {
  const result = JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        `import sqlite3,json,sys
payload=json.loads(sys.argv[1]); results=[]
for query in payload['queries']:
 conn=sqlite3.connect(':memory:');conn.executescript(payload['setup']);results.append(conn.execute(query).fetchall());conn.close()
print(json.dumps(results))`,
        JSON.stringify({
          setup: sqlSetup,
          queries: sqlTasks.map((t) => t.solution),
        }),
      ],
      { encoding: "utf8" },
    ),
  );
  assert.deepEqual(
    result,
    sqlTasks.map((t) => t.expected),
  );
});
test("the SQL enrollment schema prevents duplicate and dangling references", () => {
  const result = execFileSync(
    "python3",
    [
      "-c",
      `import sqlite3,sys
conn=sqlite3.connect(':memory:');conn.executescript(sys.argv[1]);failed=0
for query in ['INSERT INTO enrollments VALUES(1,1)','INSERT INTO enrollments VALUES(99,1)']:
 try: conn.execute(query)
 except sqlite3.IntegrityError: failed+=1
print(failed)`,
      sqlSetup,
    ],
    { encoding: "utf8" },
  ).trim();
  assert.equal(result, "2");
});
