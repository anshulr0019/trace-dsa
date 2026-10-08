import type { PlaybackRun } from "../curriculum/execution";
import type {
  Environment,
  Frame,
  RunResult,
  TraceEvent,
  Value,
  Access,
} from "../trace/interpreter";
function supported(v: unknown): v is Value {
  return (
    v === null ||
    typeof v === "boolean" ||
    (typeof v === "number" && Number.isFinite(v)) ||
    (Array.isArray(v) &&
      v.every((n) => typeof n === "number" && Number.isFinite(n)))
  );
}
function access(expression: string, vars: Environment): Access | undefined {
  const match = /^(\w+)(?:\[\s*(\w+)(?:\s*([+-])\s*(\d+))?\s*\])?$/.exec(
    expression.trim(),
  );
  if (!match) return;
  const [, name, position, op, offset] = match;
  if (!position) return name in vars ? { name, value: vars[name] } : undefined;
  const index =
      (/^\d+$/.test(position) ? Number(position) : Number(vars[position])) +
      (op === "-" ? -1 : 1) * Number(offset ?? 0),
    array = vars[name];
  return Array.isArray(array) &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < array.length
    ? { name, index, value: array[index] }
    : undefined;
}
/** Resolve a transfer only when a real assignment and the recorded values both agree. */
export function transferFromSource(
  line: string,
  write: Access,
  before: Environment,
): Access | undefined {
  const assignment =
    /^\s*(\w+(?:\[[^\]]+\])?)\s*=\s*(\w+(?:\[[^\]]+\])?)\s*;?/.exec(line);
  if (!assignment) return;
  const destination = access(assignment[1], before),
    source = access(assignment[2], before);
  if (
    destination?.name === write.name &&
    destination.index === write.index &&
    source &&
    source.value === write.value
  )
    return source;
}
/** Convert actual runtime snapshots into the foundation renderer's state contract. */
export function foundationRun(
  run: PlaybackRun,
  input: Environment,
  source = "",
): RunResult {
  let previous = { ...input },
    previousLine = 0;
  const lines = source.split("\n");
  const frames: Frame[] = run.frames
    .filter(
      (f) =>
        f.function === "solve" ||
        ["input", "complete", "error"].includes(f.event),
    )
    .map((f) => {
      const vars: Environment = { ...input };
      for (const [name, value] of Object.entries(f.vars))
        if (supported(value)) vars[name] = value;
      if (f.event === "complete" && supported(run.result))
        vars.result = run.result;
      const writes = Object.entries(vars).filter(
        ([k, v]) => JSON.stringify(v) !== JSON.stringify(previous[k]),
      );
      let event: TraceEvent | undefined;
      if (f.event === "complete") event = { kind: "complete", reads: [] };
      else {
        const arrayWrite = writes.flatMap(([name, value]) => {
          const old = previous[name];
          if (!Array.isArray(value) || !Array.isArray(old)) return [];
          const indices = value
            .map((v, i) => (v !== old[i] ? i : -1))
            .filter((i) => i >= 0);
          return indices.length === 1
            ? [{ name, index: indices[0], value: value[indices[0]] }]
            : [];
        })[0];
        const scalar = writes.find(
          ([name, value]) =>
            !Array.isArray(value) &&
            ((["mid", "total"].includes(name) &&
              typeof value === "number" &&
              value >= 0) ||
              writes.length === 1),
        );
        const write =
          arrayWrite ??
          (scalar ? { name: scalar[0], value: scalar[1] } : undefined);
        if (write) {
          const origin =
            transferFromSource(
              lines[previousLine - 1] ?? "",
              write,
              previous,
            ) ?? transferFromSource(lines[f.line - 2] ?? "", write, previous);
          event = {
            kind: "assign",
            reads: origin ? [origin] : [],
            write,
            source: origin,
          };
        }
      }
      previous = vars;
      previousLine = f.line;
      return {
        line: f.line,
        vars,
        event,
        comparisons: 0,
        message:
          f.event === "error"
            ? String(run.error)
            : f.event === "input"
              ? "Starting input."
              : f.event === "complete"
                ? "Execution complete."
                : `Recorded state at line ${f.line}. Inspect the changed values.`,
      };
    });
  const meaningful = frames.filter(
    (f, i) =>
      i === 0 ||
      f.event?.kind === "complete" ||
      i === frames.length - 1 ||
      JSON.stringify(f.vars) !== JSON.stringify(frames[i - 1].vars),
  );
  return {
    frames: meaningful.length
      ? meaningful
      : [
          {
            line: 0,
            vars: input,
            comparisons: 0,
            message: "No checkpoints recorded.",
          },
        ],
    finished: !run.error && !run.truncated,
    error: run.error || undefined,
  };
}
