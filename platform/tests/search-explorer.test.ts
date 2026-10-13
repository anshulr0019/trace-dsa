import test from "node:test";
import assert from "node:assert/strict";
import {
  searchSnapshots,
  searchPresets,
  validateSearchInput,
  linearInspections,
} from "../lib/learning/search-explorer";

test("search intervals preserve all possible matches until a result", () => {
  for (const preset of searchPresets) {
    const nums: readonly number[] = preset.nums;
    const target = preset.target;
    const frames = searchSnapshots([...nums], target);
    for (const [i, frame] of frames.entries()) {
      assert.equal(frame.comparisons, i);
      if (frame.result === null) {
        assert.equal(
          frame.mid,
          frame.left + Math.floor((frame.right - frame.left) / 2),
        );
        assert.ok(frame.left <= frame.right);
        if (nums.includes(target))
          assert.ok(
            nums.some(
              (value, index) =>
                value === target && index >= frame.left && index <= frame.right,
            ),
          );
      }
    }
    const end = frames.at(-1)!;
    if (nums.includes(target)) assert.equal(nums[end.result!], target);
    else assert.equal(end.result, -1);
    assert.ok(end.comparisons <= Math.ceil(Math.log2(nums.length + 1)));
  }
});

test("all small sorted arrays agree with membership, including negatives and duplicates", () => {
  for (let size = 0; size <= 12; size++) {
    const nums = Array.from({ length: size }, (_, i) => Math.floor(i / 2) - 3);
    for (let target = -5; target <= 5; target++) {
      const final = searchSnapshots(nums, target).at(-1)!;
      assert.equal(final.result === -1, !nums.includes(target));
      if (final.result !== -1) assert.equal(nums[final.result!], target);
      assert.equal(
        linearInspections(nums, target),
        nums.includes(target) ? nums.indexOf(target) + 1 : nums.length,
      );
    }
  }
});

test("input validation preserves the sortedness and bounded number contract", () => {
  assert.throws(() => validateSearchInput([3, 2], 2), /sorted/);
  assert.throws(() => validateSearchInput([1.5], 2), /whole/);
  assert.throws(() => validateSearchInput([Infinity], 2), /whole/);
  assert.throws(() => validateSearchInput([1], NaN), /whole/);
  assert.throws(() => validateSearchInput(Array(13).fill(0), 0), /12/);
  assert.doesNotThrow(() => validateSearchInput([], -999));
});
