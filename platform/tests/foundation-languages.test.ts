import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { lessons, lessonInputs } from "../lib/lessons";
import { runCode } from "../lib/trace/interpreter";
import {
  foundationSource,
  foundationLanguages,
} from "../lib/foundations/sources";
import { foundationRun, transferFromSource } from "../lib/foundations/adapter";
import { validateFoundationInput } from "../lib/foundations/input";
import {
  withExecutionBoundaries,
  type PlaybackFrame,
} from "../lib/curriculum/execution";
import { problems } from "../lib/curriculum/catalog";
import { hasReference } from "../lib/curriculum/playground";
for (const lesson of lessons)
  test(`${lesson.title}: four sources; real JS agrees with Python on default and boundary inputs`, () => {
    for (const language of foundationLanguages)
      assert.ok(foundationSource(lesson, 8, language.id).trim());
    const arrays =
      lesson.parameter === "k"
        ? [lesson.input, [-6, -4, -9], [-1]]
        : [
            lesson.input,
            [],
            [4],
            lesson.sorted ? [-9, -4, -1] : [-4, 8, -9, 2],
          ];
    for (const nums of arrays) {
      const parameter =
          lesson.parameter === "k"
            ? Math.min(lesson.target, nums.length)
            : lesson.target,
        input = lessonInputs(lesson, nums, parameter);
      const python = runCode(
        foundationSource(lesson, nums.length, "python"),
        input,
      );
      assert.equal(python.error, undefined);
      const frames: PlaybackFrame[] = [];
      const context = vm.createContext({
        data: input,
        trace: (vars: Record<string, unknown>) =>
          frames.push({
            line: 1,
            event: "checkpoint",
            function: "solve",
            stack: [],
            vars: JSON.parse(JSON.stringify(vars)),
          }),
      });
      const actual = new vm.Script(
        foundationSource(lesson, nums.length, "javascript") + "\nsolve(data)",
      ).runInContext(context, { timeout: 1000 });
      assert.deepEqual(
        JSON.parse(JSON.stringify(actual)),
        python.frames.at(-1)!.vars.result,
      );
      const rendered = foundationRun(
        withExecutionBoundaries(
          { frames, result: JSON.parse(JSON.stringify(actual)) },
          input,
        ),
        input,
      );
      assert.equal(rendered.finished, true);
      assert.deepEqual(
        rendered.frames.at(-1)!.vars.result,
        python.frames.at(-1)!.vars.result,
      );
    }
  });
test("all 100 roadmap problems already have references in all four languages", () => {
  assert.equal(problems.length, 100);
  for (const p of problems)
    for (const l of foundationLanguages)
      assert.ok(hasReference(p.id, l.id), `${p.id}: ${l.id}`);
});
test("foundation runner rejects unknown ids, unsorted search input and invalid windows", () => {
  assert.ok(validateFoundationInput("foundation:unknown", { nums: [] }));
  assert.ok(
    validateFoundationInput("foundation:binary-search", {
      nums: [3, 1],
      target: 1,
    }),
  );
  assert.ok(
    validateFoundationInput("foundation:sliding-window", {
      nums: [1, 2],
      k: 3,
    }),
  );
  assert.equal(
    validateFoundationInput("foundation:binary-search", {
      nums: [],
      target: 1,
    }),
    null,
  );
});
test("adapter exposes real changed array cells and execution failures", () => {
  const input = { nums: [3, 1] };
  const run = foundationRun(
    withExecutionBoundaries(
      {
        frames: [
          {
            line: 7,
            event: "checkpoint",
            function: "solve",
            stack: [],
            vars: { nums: [1, 1] },
          },
        ],
        result: null,
        error: "stopped",
      },
      input,
    ),
    input,
  );
  assert.equal(run.finished, false);
  assert.equal(run.error, "stopped");
  assert.equal(run.frames[1].event?.write?.index, 0);
});

test("movement origins require both a matching assignment and matching recorded values", () => {
  const before = { nums: [7, 3], j: 0, temp: 7 };
  assert.deepEqual(
    transferFromSource(
      "nums[j + 1] = temp;",
      { name: "nums", index: 1, value: 7 },
      before,
    ),
    { name: "temp", value: 7 },
  );
  assert.equal(
    transferFromSource(
      "nums[j + 1] = temp;",
      { name: "nums", index: 1, value: 9 },
      before,
    ),
    undefined,
  );
  assert.equal(
    transferFromSource(
      'trace("nums", nums);',
      { name: "nums", index: 1, value: 7 },
      before,
    ),
    undefined,
  );
});
