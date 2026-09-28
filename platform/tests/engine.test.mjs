import { test } from "node:test";
import assert from "node:assert/strict";
import { runCode } from "../lib/trace/interpreter.ts";
import {
  lessons,
  lessonCode,
  lessonInputs,
  validateInput,
  compareAlgorithms,
} from "../lib/lessons.ts";
function run(id, nums, param = 0) {
  const l = lessons.find((l) => l.id === id);
  const r = runCode(lessonCode(l, nums.length), lessonInputs(l, nums, param));
  assert.equal(r.error, undefined, `${id}: ${r.error}`);
  assert.equal(r.finished, true);
  return r;
}
function result(r) {
  return r.frames.at(-1).vars.result;
}
test("every reference lesson completes and preserves the initial snapshot", () => {
  for (const l of lessons) {
    const r = run(l.id, l.input, l.target);
    assert.deepEqual(r.frames[0].vars.nums, l.input);
    assert.ok(r.frames.length > 2);
  }
});
test("two pointers handle duplicates, negative values, empty input and missing pairs", () => {
  assert.deepEqual(result(run("two-sum", [1, 1], 2)), [0, 1]);
  assert.deepEqual(result(run("two-sum", [-4, -2, 0, 3, 7], 3)), [0, 4]);
  assert.equal(result(run("two-sum", [], 4)), null);
  assert.equal(result(run("two-sum", [1], 2)), null);
  assert.equal(result(run("two-sum", [1, 2, 3], 12)), null);
});
test("binary search handles all positions and absent targets", () => {
  const a = [1, 3, 5, 7, 9];
  for (let i = 0; i < a.length; i++)
    assert.equal(result(run("binary-search", a, a[i])), i);
  assert.equal(result(run("binary-search", a, 4)), -1);
  assert.equal(result(run("binary-search", [], 4)), -1);
});
test("window sum handles negative arrays and boundary window lengths", () => {
  assert.equal(result(run("sliding-window", [-5, -2, -7], 2)), -7);
  assert.equal(result(run("sliding-window", [2, 3, 4], 1)), 4);
  assert.equal(result(run("sliding-window", [2, 3, 4], 3)), 9);
});
test("sorting matches reference across randomized inputs and snapshot mutation stays isolated", () => {
  let seed = 9123;
  for (let t = 0; t < 70; t++) {
    const a = Array.from({ length: t % 12 }, () => {
      seed = (seed * 16807) % 2147483647;
      return (seed % 41) - 20;
    });
    for (const id of ["bubble-sort", "insertion-sort"]) {
      const r = run(id, a);
      assert.deepEqual(
        result(r),
        [...a].sort((a, b) => a - b),
      );
      assert.deepEqual(r.frames[0].vars.nums, a);
    }
  }
});
test("prefix sums work for arbitrary supported input lengths", () => {
  for (let n = 0; n <= 16; n++) {
    const a = Array.from({ length: n }, (_, i) => i - 3);
    const prefix = [0];
    for (const v of a) prefix.push(prefix.at(-1) + v);
    assert.deepEqual(result(run("prefix-sum", a)), prefix);
  }
});
test("edited source drives execution and aliases preserve list semantics", () => {
  const r = runCode(
    "left = 0\nleft += 3\nother = nums\nother[0] = 7\nresult = nums[0]",
    { nums: [1, 2] },
  );
  assert.equal(result(r), 7);
  assert.equal(r.frames[2].vars.left, 3);
  assert.deepEqual(r.frames[0].vars.nums, [1, 2]);
});
test("short circuit prevents invalid negative index access", () => {
  const r = runCode(
    "j = -1\nif j >= 0 and nums[j] > 2:\n    result = 1\nelse:\n    result = 2",
    { nums: [] },
  );
  assert.equal(r.error, undefined);
  assert.equal(result(r), 2);
});
test("infinite loops, imports, host access, huge ranges and malformed syntax are bounded", () => {
  for (const code of [
    "while True:\n    x = 1",
    "import os",
    "result = window.location",
    "for i in range(999999):\n    x = i",
    "x = nums[100]",
    "break",
    "x = 1 / 0",
    "x = (1",
    "x = 1 < 2 < 3",
  ]) {
    const r = runCode(code, { nums: [1] });
    assert.equal(r.finished, false, code);
    assert.ok(r.error, code);
    assert.ok(r.frames.length <= 2402);
  }
});
test("invalid or unsorted lesson inputs are rejected", () => {
  assert.throws(() => validateInput(lessons[0], "3, 1", "4"));
  assert.throws(() => validateInput(lessons[0], "2,,3", "5"));
  assert.throws(() => validateInput(lessons[2], "1,2", "3"));
  assert.deepEqual(validateInput(lessons[0], "", "2").nums, []);
});
test("comparison counts include initialization and honest small-input cases", () => {
  assert.equal(
    compareAlgorithms("two-sum", [2, 4, 7, 9, 11, 14, 18, 21], 25).b,
    2,
  );
  assert.equal(compareAlgorithms("sliding-window", [1, 2, 3], 1).a, 3);
  assert.equal(compareAlgorithms("sliding-window", [1, 2, 3], 1).b, 5);
  assert.equal(compareAlgorithms("prefix-sum", [1, 2], 0).a, 4);
  assert.equal(compareAlgorithms("prefix-sum", [1, 2], 0).b, 5);
});

test('numeric bounds include literals and boolean equality follows Python', () => {
  assert.equal(result(runCode('result = True == 1', {})), true);
  assert.equal(result(runCode('result = False == 0', {})), true);
  assert.equal(result(runCode('result = None == 0', {})), false);
  assert.equal(runCode('result = 999999999999999', {}).finished, false);
});
