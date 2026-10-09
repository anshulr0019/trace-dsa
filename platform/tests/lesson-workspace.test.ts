import test from "node:test";
import assert from "node:assert/strict";
import {
  readableSource,
  visibleSourceLine,
} from "../lib/learning/readable-source";
import {
  traceChallenges,
  matchesTraceAnswer,
} from "../lib/learning/trace-challenge";
import type { PlaybackFrame } from "../lib/curriculum/execution";
import { problems } from "../lib/curriculum/catalog";
import { playgroundSource } from "../lib/curriculum/playground";
import { pythonSources, pythonPrelude } from "../lib/curriculum/sources";

test("algorithm view hides multiline checkpoints while preserving operations and source positions", () => {
  const source = `import java.util.*;
public class Solution extends Trace {
    public Object solve(Map<String, Object> data) {
        int total = 0;
        total += 4;
        trace(
            "total", total,
            "text", "trace(should stay in a string)"
        );
        return total;
    }
}`;
  const rows = readableSource(source, "java");
  assert.deepEqual(
    rows.map((r) => r.line),
    [4, 5, 10],
  );
  assert.equal(visibleSourceLine(rows, 6), 5);
  assert.equal(visibleSourceLine(rows, 0), 0);
  assert.equal(visibleSourceLine(rows, 10), 10);
  assert.ok(rows.some((r) => r.text.includes("return total")));
  assert.equal(source.split("\n")[5].trim(), "trace(");
});
test("projection removes inline snapshots without swallowing operations or quoted trace calls", () => {
  const source = `const snapshot = () => trace({nums, i});
let total = 0;
total += nums[i]; snapshot();
const text = "trace({total});";
if (total) { snapshot(); total++; }
return total;`;
  const rows = readableSource(source, "javascript");
  assert.ok(!rows.some((r) => r.text.includes("const snapshot")));
  assert.ok(rows.some((r) => r.text.includes("total += nums[i];")));
  assert.ok(rows.some((r) => r.text.includes('"trace({total});"')));
  assert.ok(rows.some((r) => r.text.includes("total++;")));
  const custom = readableSource(
    "const snapshot = () => { nums.sort(); trace({nums}); };\nsnapshot();\nreturn nums;",
    "javascript",
  );
  assert.ok(custom.some((r) => r.text.includes("nums.sort()")));
  assert.ok(custom.some((r) => r.text.trim() === "snapshot();"));
});
test("every reference retains its return logic in all four language views", () => {
  for (const problem of problems)
    for (const language of ["python", "cpp", "java", "javascript"] as const) {
      const source =
        language === "python"
          ? pythonPrelude + pythonSources[problem.id]
          : playgroundSource(problem, language);
      const rows = readableSource(source, language);
      assert.ok(
        rows.some((r) => /\breturn\b/.test(r.text)),
        `${problem.id} ${language}`,
      );
      assert.ok(
        rows.every((r) => source.split("\n")[r.line - 1] !== undefined),
      );
    }
});
const frame = (
  vars: Record<string, unknown>,
  event = "checkpoint",
  line = 1,
): PlaybackFrame => ({ vars, event, line, function: "solve", stack: [] });
test("problem exercises derive scalar, grid and collection answers from recorded changes", () => {
  const frames = [
    frame({ grid: [[0, 0]], visited: [], count: 0 }, "input", 0),
    frame({ grid: [[1, 0]], visited: [], count: 0 }, "checkpoint", 8),
    frame({ grid: [[1, 0]], visited: [0], count: 0 }, "checkpoint", 10),
    frame({ grid: [[1, 0]], visited: [0], count: 1 }, "checkpoint", 11),
    frame({ answer: 1 }, "complete", 0),
  ];
  const questions = traceChallenges(frames);
  assert.deepEqual(
    questions.map((q) => [q.name, q.answer]),
    [
      ["grid", "[[1,0]]"],
      ["visited", "[0]"],
      ["count", "1"],
    ],
  );
  assert.ok(matchesTraceAnswer("[ [1, 0] ]", questions[0].answer));
  assert.equal(matchesTraceAnswer("[[0, 0]]", questions[0].answer), false);
  assert.deepEqual(
    traceChallenges([frame({ x: 1 }), frame({ x: 2 }, "error")]),
    [],
  );
});
