export type SearchDecision = "left" | "right" | "found";
export type SearchSnapshot = {
  left: number;
  right: number;
  mid: number | null;
  comparisons: number;
  result: number | null;
  decision: SearchDecision | null;
  explanation: string;
};

export const searchPresets = [
  {
    id: "classic",
    label: "Find a value",
    nums: [2, 4, 7, 9, 11, 14, 18, 21],
    target: 14,
  },
  {
    id: "missing",
    label: "Missing target",
    nums: [2, 4, 7, 9, 11, 14, 18, 21],
    target: 13,
  },
  {
    id: "duplicates",
    label: "Duplicates",
    nums: [2, 4, 4, 4, 9, 14, 14, 21],
    target: 4,
  },
  { id: "empty", label: "Empty array", nums: [], target: 14 },
] as const;

export function validateSearchInput(nums: number[], target: number) {
  if (nums.length > 12)
    throw new Error("Use up to 12 values so every step stays readable.");
  if (
    ![...nums, target].every((n) => Number.isInteger(n) && Math.abs(n) <= 999)
  )
    throw new Error("Use whole numbers between −999 and 999.");
  if (nums.some((n, i) => i > 0 && n < nums[i - 1]))
    throw new Error(
      "Binary search needs sorted values. Keep them in ascending order.",
    );
}

/** Each snapshot is the candidate interval before the next value inspection. */
export function searchSnapshots(
  nums: number[],
  target: number,
): SearchSnapshot[] {
  validateSearchInput(nums, target);
  const frames: SearchSnapshot[] = [];
  let left = 0,
    right = nums.length - 1,
    comparisons = 0;
  let explanation = nums.length
    ? "Sorted values let you eliminate a whole half. Compare the midpoint with the target."
    : "There are no candidates. The loop never runs, so the result is −1.";
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const decision =
      nums[mid] === target ? "found" : nums[mid] < target ? "right" : "left";
    frames.push({
      left,
      right,
      mid,
      comparisons,
      result: null,
      decision,
      explanation,
    });
    comparisons++;
    if (decision === "found") {
      frames.push({
        left,
        right,
        mid,
        comparisons,
        result: mid,
        decision: null,
        explanation: `${nums[mid]} equals ${target}. Return index ${mid}${nums.filter((n) => n === target).length > 1 ? "; this search returns a matching index, not necessarily the first" : ""}.`,
      });
      return frames;
    }
    if (decision === "right") {
      explanation = `${nums[mid]} < ${target}. Every value through index ${mid} is too small. Move left to ${mid + 1}.`;
      left = mid + 1;
    } else {
      explanation = `${nums[mid]} > ${target}. Every value from index ${mid} is too large. Move right to ${mid - 1}.`;
      right = mid - 1;
    }
  }
  frames.push({
    left,
    right,
    mid: null,
    comparisons,
    result: -1,
    decision: null,
    explanation: nums.length
      ? `${explanation} The interval is now empty: left > right. Return −1.`
      : explanation,
  });
  return frames;
}

export function linearInspections(nums: number[], target: number) {
  const index = nums.indexOf(target);
  return index < 0 ? nums.length : index + 1;
}
