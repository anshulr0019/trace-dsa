import test from "node:test";
import assert from "node:assert/strict";
import { modules } from "../lib/computer-science/catalog";
import { examplesFor } from "../lib/computer-science/examples";
import { buildLab, type Frame } from "../lib/computer-science/models";
import { simulateArchitecture } from "../lib/computer-science/architecture";
import {
  checkpoint,
  frameChanges,
  matchesPrediction,
  recordChanges,
} from "../lib/learning/evidence";
import { teachingReferences } from "../lib/learning/references";
test("before/after evidence includes additions, removals and nested state, without mutating inputs", () => {
  const before = { a: 1, removed: 2, list: [1, 2] },
    after = { a: 1, added: 3, list: [2, 1] };
  const copy = JSON.stringify(before);
  assert.deepEqual(
    recordChanges(before, after).map((c) => c.id),
    ["removed", "list", "added"],
  );
  assert.equal(JSON.stringify(before), copy);
});
test("prediction skips unchanged events and uses a recorded short value", () => {
  const f = (value: number): Frame => ({
    title: "event",
    explanation: "example",
    active: [],
    cells: [{ id: "v", label: "Value", value }],
    metrics: {},
  });
  const frames = [f(1), f(1), f(3)];
  const q = checkpoint(frames, 0)!;
  assert.equal(q.target, 2);
  assert.equal(q.change.after, "3");
  assert.equal(checkpoint(frames, 2), null);
  assert.equal(matchesPrediction(" 3 ", "3"), true);
  assert.equal(matchesPrediction("4", "3"), false);
});
test("every CS example generates finite comparison traces and truthful predictions", () => {
  let count = 0;
  for (const m of modules) {
    assert.ok(teachingReferences[m.topic]);
    const examples = examplesFor(m);
    assert.ok(examples.length >= 2, m.id);
    for (const ex of examples) {
      const run =
        m.kind === "architecture"
          ? simulateArchitecture(ex.scenario.architecture)
          : buildLab(m, ex.scenario.settings);
      assert.ok(run.frames.length > 0, `${m.id}: ${ex.title}`);
      for (let step = 0; step < run.frames.length; step++) {
        const q = checkpoint(run.frames, step);
        if (q) {
          assert.ok(q.target > step);
          assert.ok(
            frameChanges(run.frames[step], run.frames[q.target]).some(
              (c) => c.id === q.change.id && c.after === q.change.after,
            ),
          );
        }
      }
      count++;
    }
  }
  assert.equal(count, 105);
});
