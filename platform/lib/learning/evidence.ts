import type { Frame } from "../computer-science/models";
export type Evidence = {
  id: string;
  label: string;
  before: string;
  after: string;
};
const show = (v: unknown) =>
  v === undefined
    ? "not recorded"
    : typeof v === "string"
      ? v
      : JSON.stringify(v);
export function recordChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Evidence[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((k) => show(before[k]) !== show(after[k]))
    .map((k) => ({
      id: k,
      label: k,
      before: show(before[k]),
      after: show(after[k]),
    }));
}
export function frameRecords(f: Frame): Record<string, unknown> {
  return Object.fromEntries([
    ...f.cells.map((c) => [`cell:${c.id}`, c.value] as const),
    ...Object.entries(f.metrics).map(([k, v]) => [`metric:${k}`, v] as const),
    ["activity", f.active],
    ...(f.table ? [["rows", f.table.rows]] : []),
    ...(f.timeline ? [["timeline", f.timeline]] : []),
  ]);
}
export function frameChanges(before: Frame, after: Frame): Evidence[] {
  const labels = new Map(
    [...before.cells, ...after.cells].map((c) => [`cell:${c.id}`, c.label]),
  );
  return recordChanges(frameRecords(before), frameRecords(after)).map((c) => ({
    ...c,
    label: labels.get(c.id) ?? c.id.replace(/^metric:/, ""),
  }));
}
export function checkpoint(frames: Frame[], step: number) {
  for (let target = step + 1; target < frames.length; target++) {
    const changes = frameChanges(frames[step], frames[target]);
    const candidate = changes.find(
      (c) =>
        (c.id.startsWith("cell:") || c.id.startsWith("metric:")) &&
        c.after.length <= 60 &&
        c.after !== "not recorded",
    );
    if (candidate) return { target, change: candidate };
  }
  return null;
}
export function matchesPrediction(value: string, expected: string) {
  return value.trim().toLowerCase() === expected.trim().toLowerCase();
}
