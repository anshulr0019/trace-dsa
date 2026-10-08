import { lessons, validateInput } from "../lessons";
/** Same bounds used by the foundation input form, applied at the runner boundary. */
export function validateFoundationInput(
  id: string,
  input: unknown,
): string | null {
  const lesson = lessons.find((l) => `foundation:${l.id}` === id);
  if (!lesson) return "Unknown foundation lesson.";
  if (!input || typeof input !== "object" || Array.isArray(input))
    return "Input must be an object.";
  const data = input as Record<string, unknown>;
  if (
    !Array.isArray(data.nums) ||
    data.nums.some((n) => typeof n !== "number" || !Number.isInteger(n))
  )
    return "nums must be an array of whole numbers.";
  try {
    validateInput(
      lesson,
      data.nums.join(","),
      String(lesson.parameter === "none" ? 0 : data[lesson.parameter]),
    );
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
