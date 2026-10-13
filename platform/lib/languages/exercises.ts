import {
  defaultLibraryInput,
  libraryLessonById,
  type LibraryInput,
  type Topic,
} from "./catalog";
export function expectedLibraryOutput(
  topic: Topic,
  input: LibraryInput,
): unknown {
  const { nums, value, target, text } = input;
  switch (topic) {
    case "ownership":
      return {
        original: [...nums, value],
        alias: [...nums, value],
        copy: [...nums],
      };
    case "sequence":
      return { values: [...nums, value], size: nums.length + 1 };
    case "strings":
      return [...text].reverse().join("");
    case "utilities":
      return nums.filter((x) => x > 0).map((x) => 2 * x);
    case "sets":
      return [...new Set(nums)].sort((a, b) => a - b);
    case "maps":
      return nums.reduce<Record<string, number>>((out, x) => {
        out[x] = (out[x] ?? 0) + 1;
        return out;
      }, {});
    case "queue":
      return nums.length ? [...nums.slice(1), nums[0]] : [];
    case "stack":
      return [...nums].reverse();
    case "sort":
    case "heap":
      return [...nums].sort((a, b) => a - b);
    case "comparator":
      return nums
        .map((x, i) => [x, i])
        .sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    case "search": {
      const ordered = [...nums].sort((a, b) => a - b);
      const index = ordered.findIndex((x) => x >= target);
      return index < 0 ? nums.length : index;
    }
  }
}
export function validateLibraryInput(
  id: string,
  input: unknown,
): string | null {
  if (
    !id.startsWith("library:") ||
    !Object.hasOwn(libraryLessonById, id.slice(8))
  )
    return "Unknown language-library lesson.";
  if (!input || typeof input !== "object" || Array.isArray(input))
    return "Input must be a JSON object.";
  const v = input as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => !["nums", "value", "target", "text"].includes(k))
  )
    return "Use only nums, value, target, and text.";
  if (
    !Array.isArray(v.nums) ||
    v.nums.length > 32 ||
    v.nums.some((x) => !Number.isInteger(x) || Math.abs(x) > 1000)
  )
    return "nums must contain at most 32 integers between -1000 and 1000.";
  for (const key of ["value", "target"])
    if (!Number.isInteger(v[key]) || Math.abs(v[key] as number) > 1000)
      return `${key} must be an integer between -1000 and 1000.`;
  if (
    typeof v.text !== "string" ||
    v.text.length > 40 ||
    /[^\x20-\x7e]/.test(v.text)
  )
    return "text must contain at most 40 ASCII characters.";
  return null;
}
export const libraryCases: { name: string; input: LibraryInput }[] = [
  { name: "Mixed values", input: defaultLibraryInput },
  {
    name: "Empty collection",
    input: { nums: [], value: 5, target: 0, text: "" },
  },
  {
    name: "One value",
    input: { nums: [10], value: -2, target: 20, text: "a" },
  },
  {
    name: "Negatives and zero",
    input: { nums: [-3, 0, 2, -3], value: 0, target: -2, text: "a b" },
  },
  {
    name: "Duplicate boundary",
    input: { nums: [2, 2, 2, 10], value: 2, target: 2, text: "level" },
  },
  {
    name: "Already ordered",
    input: { nums: [-5, -1, 0, 8], value: 9, target: -10, text: "ABC123" },
  },
];
export function sameLibraryOutput(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return (
      a.length === b.length && a.every((x, i) => sameLibraryOutput(x, b[i]))
    );
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const x = a as Record<string, unknown>,
      y = b as Record<string, unknown>;
    return (
      Object.keys(x).length === Object.keys(y).length &&
      Object.keys(x).every(
        (k) => Object.hasOwn(y, k) && sameLibraryOutput(x[k], y[k]),
      )
    );
  }
  return false;
}
