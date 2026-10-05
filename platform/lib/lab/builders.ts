export type TreeNode = {
  value: number;
  left: number | null;
  right: number | null;
};
/** Compact BFS input is not heap indexing: nulls do not get children. */
export function readTree(input: unknown[]): TreeNode[] {
  if (!input.length || input[0] === null) return [];
  const nodes: TreeNode[] = [
      { value: Number(input[0]), left: null, right: null },
    ],
    queue = [0];
  let cursor = 1;
  while (queue.length && cursor < input.length) {
    const id = queue.shift()!;
    for (const side of ["left", "right"] as const) {
      const value = input[cursor++];
      if (value !== null && value !== undefined) {
        nodes[id][side] = nodes.length;
        queue.push(nodes.length);
        nodes.push({ value: Number(value), left: null, right: null });
      }
    }
  }
  return nodes;
}
export function writeTree(nodes: TreeNode[]): (number | null)[] {
  if (!nodes.length) return [];
  const queue: (number | null)[] = [0],
    output: (number | null)[] = [];
  const seen = new Set<number>();
  while (queue.length) {
    const id = queue.shift()!;
    if (id === null || !nodes[id] || seen.has(id)) {
      output.push(null);
      continue;
    }
    seen.add(id);
    output.push(nodes[id].value);
    queue.push(nodes[id].left, nodes[id].right);
  }
  while (output.length && output.at(-1) === null) output.pop();
  return output;
}
export function graphDefinition(input: Record<string, unknown>) {
  const key = [
    "edges",
    "times",
    "flights",
    "prerequisites",
    "rowConditions",
    "colConditions",
  ].find((k) => Array.isArray(input[k]));
  if (!key) return null;
  const edges = input[key] as number[][];
  if (
    !edges.every(
      (e) =>
        Array.isArray(e) &&
        e.length >= 2 &&
        e.every((n) => typeof n === "number"),
    )
  )
    return null;
  const base =
    key === "times" ||
    key.endsWith("Conditions") ||
    (input.n === undefined &&
      input.numCourses === undefined &&
      edges.length > 0 &&
      edges.every((e) => e[0] >= 1 && e[1] >= 1))
      ? 1
      : 0;
  const countKey =
    typeof input.numCourses === "number"
      ? "numCourses"
      : typeof input.n === "number"
        ? "n"
        : key.endsWith("Conditions")
          ? "k"
          : null;
  const count = countKey
    ? Number(input[countKey])
    : Math.max(base, ...edges.flatMap((e) => e.slice(0, 2))) + 1 - base;
  return {
    key,
    edges,
    base,
    count,
    countKey,
    weighted:
      key === "times" || key === "flights" || edges.some((e) => e.length === 3),
    reverse: key === "prerequisites",
    directed: key !== "edges",
    probability: key === "edges" && Array.isArray(input.succProb),
  };
}
