import type { Environment } from "./trace/interpreter";
export interface Question {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Lesson {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  complexity: string;
  space: string;
  input: number[];
  target: number;
  parameter: "target" | "k" | "none";
  sorted?: boolean;
  code: string;
  invariant: string;
  intuition: string;
  application: string;
  hints: string[];
  questions: Question[];
}
export const lessons: Lesson[] = [
  {
    id: "two-sum",
    title: "Two sum, two pointers",
    category: "Two pointers",
    description:
      "Find a pair that adds up to a target. Learn how sorted order lets you rule out possibilities with every move.",
    duration: "12 min",
    complexity: "O(n)",
    space: "O(1)",
    input: [2, 4, 7, 9, 11, 14, 18, 21],
    target: 25,
    parameter: "target",
    sorted: true,
    code: `left = 0
right = len(nums) - 1
result = None
while left < right:
    total = nums[left] + nums[right]
    if total == target:
        result = [left, right]
        break
    if total < target:
        left += 1
    else:
        right -= 1`,
    invariant:
      "If a pair exists, both indices are still between left and right. The input must be sorted.",
    intuition:
      "Start at opposite ends. When the sum is too small, even the largest available partner cannot help the left value. Move left forward. If the sum is too large, move right back.",
    application:
      "Use this pattern to match two sorted measurements against a fixed budget. If you sort first, account for O(n log n) preprocessing and keep original indices when needed.",
    hints: [
      "Compare nums[left] + nums[right] with the target. Which direction would make the sum larger?",
      "Because the array is sorted, moving left forward can only increase the left value. Moving right backward can only decrease the right value.",
      "When total < target, eliminate the left value. When total > target, eliminate the right value.",
    ],
    questions: [
      {
        prompt:
          "For [2, 4, 7, 9, 11, 14, 18, 21] and target 25, the first sum is 23. What should move?",
        options: [
          "Move left one position right",
          "Move right one position left",
          "Move both pointers",
          "Stop: no pair exists",
        ],
        answer: 0,
        explanation:
          "2 + 21 is too small. Every other partner for 2 is no larger than 21, so 2 cannot be part of a solution.",
      },
      {
        prompt: "Why must the input be sorted for this elimination rule?",
        options: [
          "It makes addition faster",
          "It guarantees pointer moves change the sum in a known direction",
          "It prevents duplicate values",
          "It guarantees a solution exists",
        ],
        answer: 1,
        explanation:
          "Sorted order is the reason eliminating a boundary value is safe. Duplicates are allowed and a solution need not exist.",
      },
      {
        prompt:
          "Transfer: an unsorted array must keep its original order. What is a suitable alternative?",
        options: [
          "Run two pointers anyway",
          "Use a hash map of previously seen values",
          "Always return the two largest values",
          "Delete repeated values",
        ],
        answer: 1,
        explanation:
          "Look for target − current in a hash map. This trades O(n) extra space for expected O(n) time without sorting the input.",
      },
    ],
  },
  {
    id: "binary-search",
    title: "Binary search",
    category: "Search",
    description:
      "Cut the search space in half. See exactly why the answer can only be on one side of the midpoint.",
    duration: "10 min",
    complexity: "O(log n)",
    space: "O(1)",
    input: [2, 4, 7, 9, 11, 14, 18, 21],
    target: 14,
    parameter: "target",
    sorted: true,
    code: `left = 0
right = len(nums) - 1
result = -1
while left <= right:
    mid = (left + right) // 2
    if nums[mid] == target:
        result = mid
        break
    if nums[mid] < target:
        left = mid + 1
    else:
        right = mid - 1`,
    invariant:
      "If the target exists, it remains in the inclusive interval [left, right].",
    intuition:
      "Inspect the midpoint. Sorted order lets you discard everything on the wrong side, including the midpoint you have already checked.",
    application:
      "Find an item in a sorted in-memory index, or search a monotone answer space. A database index may use a B-tree rather than this exact array implementation.",
    hints: [
      "Look at nums[mid]. Is the target smaller or larger?",
      "The midpoint has already been checked. The next interval must exclude it.",
      "Use left = mid + 1 or right = mid - 1 so the interval always shrinks.",
    ],
    questions: [
      {
        prompt:
          "The middle value is 9 and the target is 14. What can be discarded?",
        options: [
          "The midpoint and everything to its left",
          "Everything to the right",
          "Only the first value",
          "Nothing",
        ],
        answer: 0,
        explanation:
          "Every value at or left of the midpoint is at most 9, which is smaller than 14.",
      },
      {
        prompt: "Why use left <= right rather than left < right?",
        options: [
          "To check a remaining interval of one element",
          "To handle only even-length arrays",
          "To permit an infinite loop",
          "To avoid division",
        ],
        answer: 0,
        explanation: "When left equals right, one unchecked candidate remains.",
      },
      {
        prompt:
          "For a sorted array of one million items, how many candidate checks does binary search need at most?",
        options: [
          "About 20",
          "About 1,000",
          "About 500,000",
          "Exactly one million",
        ],
        answer: 0,
        explanation:
          "Repeated halving takes about log₂(1,000,000), or 20 checks.",
      },
    ],
  },
  {
    id: "sliding-window",
    title: "Maximum window sum",
    category: "Sliding window",
    description:
      "Stop repeating work. Reuse the previous sum as a fixed-size window moves across the array.",
    duration: "14 min",
    complexity: "O(n)",
    space: "O(1)",
    input: [2, 4, 7, 9, 3, 6, 1, 5],
    target: 3,
    parameter: "k",
    code: `total = 0
for i in range(k):
    total += nums[i]
best = total
left = 0
for right in range(k, len(nums)):
    total += nums[right]
    total -= nums[left]
    left += 1
    best = max(best, total)
result = best`,
    invariant:
      "After each complete window update, total is the sum of exactly k consecutive values.",
    intuition:
      "Adjacent windows share k − 1 values. Add the incoming value and subtract the outgoing value instead of summing the whole window again.",
    application:
      "Compute a rolling total across fixed-size batches of readings. A time-based window also needs a policy for timestamps and late events.",
    hints: [
      "Which values are shared by consecutive windows?",
      "Only two values change: one enters on the right and one leaves on the left.",
      "Update total by adding nums[right] and subtracting nums[left].",
    ],
    questions: [
      {
        prompt:
          "The window [2, 4, 7] has sum 13. The next value is 9. What is the next sum?",
        options: ["22", "20", "11", "13"],
        answer: 1,
        explanation:
          "Subtract the outgoing 2 and add the incoming 9: 13 − 2 + 9 = 20.",
      },
      {
        prompt:
          "What happens if the input contains only negative values and best starts at 0?",
        options: [
          "It still always works",
          "It can return 0 even when no window sums to 0",
          "It runs faster",
          "The window becomes empty",
        ],
        answer: 1,
        explanation:
          "Initialize best from the first real window so negative maxima are handled correctly.",
      },
      {
        prompt:
          "For n items and fixed window length k, recomputing every window costs what?",
        options: ["O(1)", "O(log n)", "O((n − k + 1) × k)", "O(n!)"],
        answer: 2,
        explanation:
          "There are n − k + 1 windows and each requires k additions. Reusing the sum reduces the total work to O(n).",
      },
    ],
  },
  {
    id: "bubble-sort",
    title: "Bubble sort",
    category: "Sorting",
    description:
      "Watch adjacent swaps move the largest remaining value into place, one pass at a time.",
    duration: "10 min",
    complexity: "O(n²)",
    space: "O(1)",
    input: [7, 3, 9, 2, 6, 1, 8, 4],
    target: 0,
    parameter: "none",
    code: `for end in range(len(nums) - 1, 0, -1):
    for j in range(end):
        if nums[j] > nums[j + 1]:
            temp = nums[j]
            nums[j] = nums[j + 1]
            nums[j + 1] = temp
result = nums`,
    invariant:
      "After each full pass, the largest value in the unsorted prefix is at end. The suffix after end is sorted.",
    intuition:
      "An adjacent comparison moves the larger value to the right. Repeating that local move eventually settles the largest remaining value.",
    application:
      "Useful for learning local swaps and invariants. For real sorting workloads, use the language’s standard sorting library.",
    hints: [
      "Compare nums[j] with nums[j + 1]. Which belongs on the right?",
      "A single pass settles one largest value. The remaining prefix is still unsorted.",
      "The next pass can stop one position earlier because the last value is already settled.",
    ],
    questions: [
      {
        prompt: "After one full left-to-right pass, what is guaranteed?",
        options: [
          "The whole array is sorted",
          "The largest value is at the end",
          "The smallest value is at the end",
          "Every value moved once",
        ],
        answer: 1,
        explanation:
          "Each adjacent comparison moves the larger item rightward, carrying a maximum to the end.",
      },
      {
        prompt:
          "This implementation has no early-exit flag. Its time on an already sorted input is…",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        answer: 3,
        explanation:
          "The nested loops perform every comparison even when no swaps are necessary.",
      },
      {
        prompt: "What improvement detects an already sorted array in one pass?",
        options: [
          "A flag recording whether any swap occurred",
          "A bigger temporary variable",
          "Reversing the input",
          "Comparing only the first pair",
        ],
        answer: 0,
        explanation:
          "If an entire pass makes no swaps, the array is sorted and execution can stop.",
      },
    ],
  },
  {
    id: "insertion-sort",
    title: "Insertion sort",
    category: "Sorting",
    description:
      "Build a sorted prefix. Insert each new value into the right place by shifting larger values.",
    duration: "12 min",
    complexity: "O(n²)",
    space: "O(1)",
    input: [7, 3, 9, 2, 6, 1, 8, 4],
    target: 0,
    parameter: "none",
    code: `for i in range(1, len(nums)):
    key = nums[i]
    j = i - 1
    while j >= 0 and nums[j] > key:
        nums[j + 1] = nums[j]
        j -= 1
    nums[j + 1] = key
result = nums`,
    invariant:
      "Before each outer iteration, nums[0:i] is sorted. key temporarily holds the value being inserted.",
    intuition:
      "Like arranging cards in your hand: take one new card, shift larger cards over, and place it into the gap.",
    application:
      "Useful for small or nearly sorted sequences. It can serve as a small-partition building block in hybrid sorting implementations.",
    hints: [
      "The prefix before i is already sorted. Which values are larger than key?",
      "During shifting, a value can appear twice in the array. The displaced key is safely held in its own variable.",
      "Stop shifting when j is negative or nums[j] <= key, then write key to j + 1.",
    ],
    questions: [
      {
        prompt: "Why store nums[i] in key before shifting?",
        options: [
          "To preserve the value that shifting will overwrite",
          "To double the input size",
          "To make all values unique",
          "To avoid comparisons",
        ],
        answer: 0,
        explanation:
          "Shifts overwrite the insertion slot. key keeps the original value until its final position is known.",
      },
      {
        prompt: "How does insertion sort behave on an already sorted array?",
        options: [
          "Quadratic work is unavoidable",
          "Linear work: each new value needs no shifts",
          "It fails",
          "It reverses the array",
        ],
        answer: 1,
        explanation:
          "Each outer iteration checks the previous value and performs no shifts, giving O(n) best-case time.",
      },
      {
        prompt:
          "During a shift, you see [3, 7, 9, 9] with key = 2. Has 2 been lost?",
        options: [
          "Yes",
          "No: it is held in key until insertion",
          "Only if the array is sorted",
          "The algorithm cannot handle 2",
        ],
        answer: 1,
        explanation:
          "Intermediate arrays may contain duplicates while key preserves the value being inserted.",
      },
    ],
  },
  {
    id: "prefix-sum",
    title: "Prefix sums",
    category: "Arrays",
    description:
      "Turn repeated range additions into subtraction by storing the total up to each position.",
    duration: "10 min",
    complexity: "O(n) build",
    space: "O(n)",
    input: [2, 4, 7, 9, 3, 6, 1, 5],
    target: 0,
    parameter: "none",
    code: `prefix = [0, 0, 0, 0, 0, 0, 0, 0, 0]
for i in range(len(nums)):
    prefix[i + 1] = prefix[i] + nums[i]
result = prefix`,
    invariant: "prefix[i] is the sum of the first i values. prefix[0] is 0.",
    intuition:
      "A range sum is the total up to its end minus the total before its start. Pay once to build the prefix array, then answer each range query in constant time.",
    application:
      "Answer many historical range-total queries against a fixed dataset. Frequent updates may call for a Fenwick tree or segment tree instead.",
    hints: [
      "Why does prefix have one more slot than nums?",
      "The extra zero makes a range starting at index 0 work with the same formula.",
      "For an inclusive range [left, right], subtract prefix[left] from prefix[right + 1].",
    ],
    questions: [
      {
        prompt:
          "If prefix is [0, 2, 6, 13, 22], what is the sum of nums[1:3] (indices 1 and 2)?",
        options: ["13", "11", "6", "22"],
        answer: 1,
        explanation: "prefix[3] − prefix[1] = 13 − 2 = 11, the sum of 4 and 7.",
      },
      {
        prompt: "What is the time per range-sum query after preprocessing?",
        options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
        answer: 0,
        explanation:
          "Each query uses two lookups and one subtraction, independent of range length.",
      },
      {
        prompt: "What changes if one input value is updated?",
        options: [
          "No prefix sums change",
          "Every prefix after that value may need updating",
          "Only prefix[0] changes",
          "The array must be sorted",
        ],
        answer: 1,
        explanation:
          "Prefix sums are best for fixed data; one update can affect a whole suffix of totals.",
      },
    ],
  },
];
export function lessonCode(lesson: Lesson, n: number) {
  return lesson.id === "prefix-sum"
    ? lesson.code.replace(
        "[0, 0, 0, 0, 0, 0, 0, 0, 0]",
        `[${Array(n + 1)
          .fill(0)
          .join(", ")}]`,
      )
    : lesson.code;
}
export function lessonInputs(
  lesson: Lesson,
  nums: number[],
  parameter: number,
): Environment {
  return {
    nums,
    ...(lesson.parameter === "none" ? {} : { [lesson.parameter]: parameter }),
  };
}
export function validateInput(lesson: Lesson, raw: string, param: string) {
  const parts = raw.trim() ? raw.split(",").map((s) => s.trim()) : [];
  if (parts.some((s) => !/^[-+]?\d+$/.test(s)))
    throw new Error(
      "Use comma-separated whole numbers, for example 2, 4, 7, 9.",
    );
  const nums = parts.map(Number);
  if (nums.length > 16)
    throw new Error("Use at most 16 values so every step stays readable.");
  if (nums.some((n) => Math.abs(n) > 999))
    throw new Error("Use values from −999 to 999.");
  if (lesson.sorted && nums.some((n, i) => i > 0 && n < nums[i - 1]))
    throw new Error(
      "This lesson requires ascending input. Sort your values first.",
    );
  const parameter = Number(param);
  if (
    lesson.parameter !== "none" &&
    (!param.trim() ||
      !Number.isInteger(parameter) ||
      Math.abs(parameter) > 9999)
  )
    throw new Error("Enter a whole-number target from −9999 to 9999.");
  if (lesson.parameter === "k" && (parameter < 1 || parameter > nums.length))
    throw new Error("Window size must be between 1 and the array length.");
  return { nums, parameter };
}
export interface Comparison {
  baseline: string;
  optimized: string;
  a: number;
  b: number;
  unit: string;
  baselineBigO: string;
  optimizedBigO: string;
  note: string;
}
export function compareAlgorithms(
  id: string,
  nums: number[],
  target: number,
): Comparison {
  let a = 0,
    b = 0;
  const n = nums.length;
  if (id === "two-sum") {
    let found = false;
    for (let i = 0; i < n && !found; i++)
      for (let j = i + 1; j < n; j++) {
        a++;
        if (nums[i] + nums[j] === target) {
          found = true;
          break;
        }
      }
    let l = 0,
      r = n - 1;
    while (l < r) {
      b++;
      const sum = nums[l] + nums[r];
      if (sum === target) break;
      if (sum < target) l++;
      else r--;
    }
    return {
      baseline: "Try every pair",
      optimized: "Two pointers",
      a,
      b,
      unit: "candidate pairs checked",
      baselineBigO: "O(n²)",
      optimizedBigO: "O(n)",
      note: "Both runs stop at the first matching pair and use the same sorted input. Sorting cost is excluded; unsorted input needs preprocessing.",
    };
  }
  if (id === "binary-search") {
    for (const v of nums) {
      a++;
      if (v === target) break;
    }
    let l = 0,
      r = n - 1;
    while (l <= r) {
      b++;
      const m = Math.floor((l + r) / 2);
      if (nums[m] === target) break;
      if (nums[m] < target) l = m + 1;
      else r = m - 1;
    }
    return {
      baseline: "Linear search",
      optimized: "Binary search",
      a,
      b,
      unit: "candidate values checked",
      baselineBigO: "O(n)",
      optimizedBigO: "O(log n)",
      note: "These are counts for this input, not timing measurements. A target at the start can favor linear search.",
    };
  }
  if (id === "sliding-window") {
    a = (n - target + 1) * target;
    b = target + 2 * (n - target);
    return {
      baseline: "Recompute each sum",
      optimized: "Reuse the window",
      a,
      b,
      unit: "additions and subtractions",
      baselineBigO: "O(n × k)",
      optimizedBigO: "O(n)",
      note: "Includes constructing the first window. Tiny windows can favor direct summation; the reusable window saves work as k grows.",
    };
  }
  if (id === "prefix-sum") {
    a = 0;
    for (let l = 0; l < n; l++) for (let r = l; r < n; r++) a += r - l + 1;
    b = n + (n * (n + 1)) / 2;
    return {
      baseline: "Sum every range directly",
      optimized: "Build once, then query",
      a,
      b,
      unit: "additions and subtractions",
      baselineBigO: "O(n³) for all ranges",
      optimizedBigO: "O(n²) for all ranges",
      note: "This experiment queries all n(n + 1)/2 nonempty ranges once. Prefix counts include n build additions plus one subtraction per query.",
    };
  }
  const bubble = [...nums],
    insert = [...nums];
  for (let end = n - 1; end > 0; end--)
    for (let j = 0; j < end; j++) {
      a++;
      if (bubble[j] > bubble[j + 1])
        [bubble[j], bubble[j + 1]] = [bubble[j + 1], bubble[j]];
    }
  for (let i = 1; i < n; i++) {
    const key = insert[i];
    let j = i - 1;
    while (j >= 0) {
      b++;
      if (insert[j] <= key) break;
      insert[j + 1] = insert[j];
      j--;
    }
    insert[j + 1] = key;
  }
  return {
    baseline: "Bubble sort",
    optimized: "Insertion sort",
    a,
    b,
    unit: "value comparisons",
    baselineBigO: "O(n²) worst case",
    optimizedBigO: "O(n²) worst case",
    note: "Both have quadratic worst-case time. Insertion sort adapts to existing order; a faster count on one input does not change its worst-case complexity.",
  };
}
