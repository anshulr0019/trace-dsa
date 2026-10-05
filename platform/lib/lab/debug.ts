import type { ExecutionFrame } from "../../components/curriculum/scene";
/** Read paths without evaluating learner text or invoking object prototypes. */
export function watchValue(
  vars: Record<string, unknown>,
  path: string,
): { found: boolean; value: unknown } {
  const normalized = path.trim().replace(/\[(\d+)\]/g, ".$1");
  if (!/^[A-Za-z_]\w*(?:\.(?:[A-Za-z_]\w*|\d+))*$/.test(normalized))
    return { found: false, value: undefined };
  let value: unknown = vars;
  for (const key of normalized.split(".")) {
    if (
      ["__proto__", "prototype", "constructor"].includes(key) ||
      !value ||
      typeof value !== "object" ||
      !Object.prototype.hasOwnProperty.call(value, key)
    )
      return { found: false, value: undefined };
    value = (value as Record<string, unknown>)[key];
  }
  return { found: true, value };
}
export function nextDebugStep(
  frames: ExecutionFrame[],
  step: number,
  action: "into" | "over" | "out",
) {
  if (action === "into") return Math.min(frames.length - 1, step + 1);
  const depth = frames[step]?.stack?.length ?? 0;
  for (let i = step + 1; i < frames.length; i++)
    if (
      action === "over"
        ? (frames[i].stack?.length ?? 0) <= depth
        : (frames[i].stack?.length ?? 0) < depth
    )
      return i;
  return Math.max(0, frames.length - 1);
}
export function pausedAtBreakpoint(
  frames: ExecutionFrame[],
  step: number,
  lines: number[],
  lastPaused: number,
) {
  return (
    step !== lastPaused &&
    step > 0 &&
    lines.includes(frames[step]?.line) &&
    frames[step]?.event !== "complete" &&
    frames[step]?.event !== "input"
  );
}
