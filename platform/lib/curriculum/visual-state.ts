import type { Problem } from "./catalog";
import type { PlaybackFrame } from "./execution";
import { lessons } from "./learning";
export type State = Record<string, unknown>;
export const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
export const record = (v: unknown): State =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as State) : {};
export const text = (v: unknown): string =>
  typeof v === "string" ? v : (JSON.stringify(v) ?? "—");
export const at = (v: unknown, key: string | number) =>
  v && typeof v === "object" ? (v as State)[key] : undefined;
export const finite = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);
export const integer = (v: unknown): v is number =>
  finite(v) && Number.isInteger(v);
export const changed = (a: unknown, b: unknown) => text(a) !== text(b);
export const matrix = (v: unknown): unknown[][] =>
  list(v).map((row) => (typeof row === "string" ? [...row] : list(row)));
export function cells(v: unknown): Set<string> {
  const rows = list(v);
  if (rows.some((row) => list(row).some((value) => typeof value === "boolean")))
    return new Set(
      rows.flatMap((row, r) =>
        list(row).flatMap((value, c) => (value === true ? [`${r},${c}`] : [])),
      ),
    );
  return new Set(
    rows
      .filter((p): p is unknown[] => Array.isArray(p) && p.length >= 2)
      .map((p) => `${p[0]},${p[1]}`),
  );
}
export function rootOf(parent: unknown, id: string): string {
  const seen = new Set<string>();
  let current = id;
  for (let i = 0; i < 100; i++) {
    const next = at(parent, current);
    if (
      next === undefined ||
      next === null ||
      Number(next) < 0 ||
      String(next) === current ||
      seen.has(current)
    )
      return current;
    seen.add(current);
    current = String(next);
  }
  return current;
}
export function gridData(
  p: Problem,
  input: State,
  vars: State,
): { name: string; values: unknown[][]; original: unknown[][] } {
  const name =
    p.id === "search-matrix"
      ? "matrix"
      : p.id === "n-queens" || p.id === "word-search-ii"
        ? "board"
        : "grid";
  const original = matrix(input[name] ?? input.heights);
  let values = matrix(
    vars[name] ??
      (name === "grid" ? vars.heights : undefined) ??
      input[name] ??
      input.heights,
  );
  if (!values.length && p.id === "islands-ii")
    values = Array.from({ length: Math.min(64, Number(input.m) || 0) }, () =>
      Array(Math.min(64, Number(input.n) || 0)).fill(0),
    );
  if (!values.length && p.id === "n-queens")
    values = Array.from({ length: Math.min(32, Number(input.n) || 0) }, () =>
      Array(Math.min(32, Number(input.n) || 0)).fill("."),
    );
  if (!values.length && p.id === "build-matrix")
    values = Array.from({ length: Math.min(32, Number(input.k) || 0) }, () =>
      Array(Math.min(32, Number(input.k) || 0)).fill(0),
    );
  return { name, values, original };
}
export function gridCursor(
  v: State,
  source = "",
): [number, number] | undefined {
  const pairs = /(?:grid|board|matrix)\s*\[r\]\s*\[c\]/.test(source)
    ? [
        ["r", "c"],
        ["row", "col"],
      ]
    : [
        ["row", "col"],
        ["r", "c"],
        ["nr", "nc"],
        ["i", "j"],
      ];
  for (const [r, c] of pairs)
    if (integer(v[r]) && integer(v[c])) return [v[r], v[c]];
  return undefined;
}
export function dpFocus(p: Problem, v: State): [number, number] | undefined {
  if (p.id === "palindromic-substrings" || p.id === "burst-balloons-dp")
    return integer(v.left) && integer(v.right) ? [v.left, v.right] : undefined;
  return gridCursor(v);
}
export function dpDependencies(
  p: Problem,
  v: State,
  focus?: [number, number],
): [number, number][] {
  if (!focus) return [];
  const [r, c] = focus;
  if (p.id === "unique-paths")
    return [
      [r - 1, c],
      [r, c - 1],
    ].filter(([a, b]) => a >= 0 && b >= 0) as [number, number][];
  if (["edit-distance", "longest-common-subsequence"].includes(p.id))
    return [
      [r - 1, c],
      [r, c - 1],
      [r - 1, c - 1],
    ].filter(([a, b]) => a >= 0 && b >= 0) as [number, number][];
  if (p.id === "regex-matching")
    return [
      [r - 1, c - 1],
      [r, c - 2],
      [r - 1, c],
    ].filter(([a, b]) => a >= 0 && b >= 0) as [number, number][];
  if (p.id === "palindromic-substrings")
    return r + 1 < c ? [[r + 1, c - 1]] : [];
  if (p.id === "burst-balloons-dp" && integer(v.k))
    return [
      [r, v.k],
      [v.k, c],
    ];
  return [];
}
export function dpIndex(p: Problem, v: State): number | undefined {
  if (!integer(v.i)) return undefined;
  return p.id === "house-robber" ? v.i + 2 : v.i;
}
export function dpInputs(
  p: Problem,
  input: State,
): { row: string[]; col: string[]; label: string } {
  if (p.id === "edit-distance")
    return {
      row: ["∅", ...String(input.word1 ?? "")],
      col: ["∅", ...String(input.word2 ?? "")],
      label: "Minimum edits between prefixes",
    };
  if (p.id === "longest-common-subsequence")
    return {
      row: ["∅", ...String(input.text1 ?? "")],
      col: ["∅", ...String(input.text2 ?? "")],
      label: "Longest shared subsequence between prefixes",
    };
  if (p.id === "regex-matching")
    return {
      row: ["∅", ...String(input.s ?? "")],
      col: ["∅", ...String(input.p ?? "")],
      label: "Does this text prefix match this pattern prefix?",
    };
  if (p.id === "palindromic-substrings")
    return {
      row: [...String(input.s ?? "")],
      col: [...String(input.s ?? "")],
      label: "Is the substring from row to column a palindrome?",
    };
  if (p.id === "burst-balloons-dp") {
    const row = ["1", ...list(input.nums).map(text), "1"];
    return {
      row,
      col: row,
      label: "Best coins inside the open interval (left, right)",
    };
  }
  return {
    row: [],
    col: [],
    label: "Ways to reach each cell from the top left",
  };
}
export function visualStory(
  p: Problem,
  frame: PlaybackFrame | undefined,
  previous: PlaybackFrame | undefined,
  input: State,
): { text: string; equation?: string } {
  const v = frame?.vars ?? {},
    old = previous?.vars ?? {},
    guide = lessons[p.id];
  if (!frame || frame.event === "input") return { text: guide.idea };
  if (frame.event === "error")
    return {
      text: "Execution stopped. Inspect the last recorded state and the error beside the code.",
    };
  if (frame.event === "complete")
    return {
      text: `Execution finished. Returned answer: ${text(v.answer).slice(0, 170)}. Select a cell or node to inspect it, or step backward to revisit a decision.`,
    };
  if (p.scene === "grid" || p.id === "n-queens") {
    const g = gridData(p, input, v),
      cursor = gridCursor(v);
    const [r, c] = cursor ?? [-1, -1];
    const alterations = g.values.flatMap((row, r) =>
      row
        .map((value, c) => ({ r, c, value }))
        .filter(
          (x) =>
            at(at(old[g.name], r), x.c) !== undefined &&
            changed(x.value, at(at(old[g.name], r), x.c)),
        ),
    );
    if (p.id === "n-queens") {
      const queens = g.values.flatMap((row, r) =>
        row.map((x, c) => (x === "Q" ? [r, c] : null)).filter(Boolean),
      );
      return {
        text: `${queens.length} queen${queens.length === 1 ? "" : "s"} currently placed. ${v.phase === "reject" ? "Reject this square: its column or diagonal is already occupied." : v.phase === "undo" || alterations.some((x) => x.value === ".") ? "A queen was removed: return to the earlier choice and try another column." : v.phase === "place" ? "Place a queen on this safe square, then explore the next row." : "Queens must use different columns and diagonals. The board marks squares attacked by the placed queens."}`,
      };
    }
    if (p.id === "rotting-oranges")
      return {
        text: alterations.length
          ? `${alterations.length} recorded cell${alterations.length === 1 ? " became" : "s became"} rotten. The queue holds the next cells to spread from; each wave adds one minute.`
          : `${cursor ? `Inspect cell [${r}, ${c}]. ` : ""}Rot spreads to fresh oranges sharing a side. Separate starting oranges spread together.`,
        equation:
          v.fresh !== undefined
            ? `Recorded fresh counter: ${text(v.fresh)}${v.time !== undefined || v.minutes !== undefined ? ` · Minute: ${text(v.time ?? v.minutes)}` : ""}`
            : undefined,
      };
    if (["number-islands", "max-island-area", "islands-ii"].includes(p.id))
      return {
        text: `${cursor ? `Cell [${r}, ${c}]. ` : ""}${p.id === "islands-ii" ? "Add land, then join adjacent components. A repeated insertion keeps the component count unchanged." : "Land cells sharing a side belong to the same island. Mark each reached cell so it is not counted again."}`,
        equation:
          v.islands !== undefined
            ? `Islands found: ${text(v.islands)}`
            : v.count !== undefined
              ? `Components: ${text(v.count)}`
              : v.area !== undefined
                ? `Current area: ${text(v.area)} · Best: ${text(v.best)}`
                : undefined,
      };
    if (p.id === "pacific-atlantic")
      return {
        text: "Search from ocean borders toward equal or higher ground. A cell reached from both borders can drain to both oceans. Recorded visits are outlined on the height map.",
      };
    if (p.id === "search-matrix")
      return {
        text: cursor
          ? `Flat index ${r * g.values[0].length + c} maps to row ${r}, column ${c}. Compare ${text(g.values[r]?.[c])} with target ${text(input.target)} to choose the remaining half.`
          : "Treat the row-ordered matrix as one sorted sequence, then repeatedly halve the candidate range.",
      };
    if (p.id === "word-search-ii")
      return {
        text: "Follow adjacent letters that extend a trie prefix. Cells marked # are being used in this branch; restore each letter when returning from it.",
      };
    if (p.id === "swim-water")
      return {
        text: "Choose the frontier cell with the lowest path cost. That cost is the highest elevation encountered on the route so far.",
        equation:
          v.cost !== undefined
            ? `Current path cost: ${text(v.cost)}`
            : undefined,
      };
    return { text: guide.idea };
  }
  if (p.scene === "dp") {
    const focus = dpFocus(p, v),
      index = dpIndex(p, v),
      dp = v.dp;
    if (p.id === "target-sum")
      return {
        text: `For the recorded value ${text(v.value)}, extend every reachable total with +value and −value. Each card stores a total and the number of sign choices that reach it.`,
      };
    if (p.id === "stock-cooldown")
      return {
        text: "Track three choices: holding a share, selling today, or resting. Only a prior resting state can buy; selling enters the cooldown.",
        equation: `Hold ${text(v.hold)} · Sold ${text(v.sold)} · Rest ${text(v.rest)}`,
      };
    if (focus && Array.isArray(dp)) {
      const [r, c] = focus;
      return {
        text: `Table cell [${r}, ${c}] represents a smaller subproblem. Blue cells show reference recurrence dependencies; the green outline marks the current recorded indices.`,
        equation:
          at(at(dp, r), c) !== undefined
            ? `dp[${r}][${c}] currently stores ${text(at(at(dp, r), c))}`
            : undefined,
      };
    }
    if (index !== undefined && Array.isArray(dp))
      return {
        text: `Reuse earlier answers to build dp[${index}]. ${guide.steps[0]}`,
        equation:
          dp[index] !== undefined
            ? `dp[${index}] currently stores ${text(dp[index])}`
            : undefined,
      };
    return { text: guide.idea };
  }
  if (p.scene === "graph") {
    if (v.parent)
      return {
        text: "Each node belongs to a component rooted at its representative. Group colours come from the recorded parent links; merging two roots joins their components.",
        equation:
          v.components !== undefined
            ? `Components: ${text(v.components)}`
            : undefined,
      };
    if (p.group === 15)
      return {
        text: `${v.current !== undefined ? `Process ${text(v.current)}. ` : ""}A node becomes ready when its remaining prerequisite count reaches zero. The ready queue feeds the output order.`,
      };
    if (p.id === "word-ladder")
      return {
        text: `${v.current !== undefined ? `Explore “${text(v.current)}”. ` : ""}Each connection changes one letter. Breadth-first layers count the shortest number of transformations.`,
      };
    return {
      text: `${v.current !== undefined ? `Inspect node ${text(v.current)}. ` : ""}Compare candidate routes and update a node's recorded best ${p.id === "maximum-probability" ? "probability" : "cost"}. Edge labels show the connection ${p.id === "maximum-probability" ? "probability" : "weight"}.`,
      equation:
        v.cost !== undefined
          ? `Current cost: ${text(v.cost)}`
          : v.probability !== undefined
            ? `Current probability: ${text(v.probability)}`
            : undefined,
    };
  }
  if (p.scene === "backtrack") {
    const path = typeof v.path === "string" ? [...v.path] : list(v.path),
      before = typeof old.path === "string" ? [...old.path] : list(old.path);
    return {
      text:
        path.length < before.length
          ? "Undo the last choice and return to the earlier branch. Try its next available option."
          : path.length > before.length
            ? "A new choice extends the current path. Explore that branch before returning to try another."
            : "The path shows the current choices. Completed answers are collected separately; choose, explore, then undo.",
      equation:
        v.remaining !== undefined
          ? `Remaining to reach target: ${text(v.remaining)}`
          : undefined,
    };
  }
  if (p.scene === "tree")
    return {
      text: `${v.current !== undefined ? `Inspect node ${text(v.current)}. ` : ""}${p.group === 10 ? "The queue visits one level at a time. Children join the back; the next node leaves the front." : "Follow the children, then combine their returned values at the parent. The active node is outlined and its recorded child values are shown below."}`,
      equation:
        v.a !== undefined && v.b !== undefined
          ? `Left contribution ${text(v.a)} · Right contribution ${text(v.b)}`
          : undefined,
    };
  if (p.scene === "linked")
    return {
      text: "Follow the arrows between node identities. Moving a pointer changes the selected node; changing a link redirects the arrow. Different pointer labels stay visible when they meet.",
    };
  if (p.scene === "heap")
    return {
      text:
        p.id === "median-stream"
          ? "The lower max-heap and upper min-heap keep the two middle candidates at their roots. Rebalance their sizes before reading the median."
          : "The heap root is the next priority candidate. Each parent connects to its children; a heap is partially ordered, so its lower rows need not be sorted.",
    };
  if (p.scene === "stack")
    return {
      text:
        list(v.stack).length < list(old.stack).length
          ? "The top item was removed. The next item underneath becomes the top."
          : list(v.stack).length > list(old.stack).length
            ? "An item was pushed onto the top. It will be the first item removed."
            : guide.idea,
    };
  return { text: guide.idea };
}
