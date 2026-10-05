"use client";
import { useId, useState } from "react";
import { motion } from "motion/react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { PlaybackFrame } from "@/lib/curriculum/execution";
import {
  list,
  record,
  text,
  at,
  rootOf,
  changed,
  integer,
  type State,
} from "@/lib/curriculum/visual-state";
import { readTree } from "@/lib/lab/builders";
import {
  StageLabel,
  Readout,
  Legend,
  Stats,
  Track,
  Details,
  useStageMotion,
} from "./shared";
export type VisualNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  note?: string;
  group?: number;
  terminal?: boolean;
};
export type VisualEdge = {
  from: string;
  to: string;
  label?: string;
  kind?: string;
  directed?: boolean;
};
export function NetworkCanvas({
  nodes,
  edges,
  vars,
  previous = {},
  speed = 1,
  height = 340,
  width = 700,
  nodeRadius = 25,
}: {
  nodes: VisualNode[];
  edges: VisualEdge[];
  vars: State;
  previous?: State;
  speed?: number;
  height?: number;
  width?: number;
  nodeRadius?: number;
}) {
  const scope = useId().replace(/:/g, ""),
    [selected, setSelected] = useState<string | null>(null),
    transition = useStageMotion(speed);
  const pointerKeys = [
    "current",
    "neighbor",
    "slow",
    "fast",
    "previous",
    "following",
    "head",
    "tail",
    "root",
    "x",
  ];
  const pointers = pointerKeys.filter(
    (k) =>
      vars[k] !== undefined &&
      !Array.isArray(vars[k]) &&
      typeof vars[k] !== "object",
  );
  const queue = new Set(
      list(vars.queue).map((v) => String(Array.isArray(v) ? v[0] : v)),
    ),
    visited = new Set(list(vars.visited).map(String));
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return (
    <>
      <div
        className="viz-network-scroll"
        tabIndex={0}
        aria-label="Node diagram, scroll for large structures"
      >
        <svg
          className="viz-network"
          role="group"
          aria-label="Interactive node and edge diagram"
          viewBox={`0 0 ${width} ${height}`}
          style={{
            minWidth: nodes.length > 15 ? Math.max(600, width) : 320,
            minHeight: nodes.length > 15 ? height : undefined,
            maxHeight: nodes.length > 15 ? "none" : undefined,
          }}
        >
          <defs>
            <marker
              id={`viz-arrow-${scope}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>
          {edges.map((edge, i) => {
            const a = nodeMap.get(edge.from),
              b = nodeMap.get(edge.to);
            if (!a || !b) return null;
            const dx = b.x - a.x,
              dy = b.y - a.y,
              len = Math.hypot(dx, dy) || 1,
              ax = a.x + (dx / len) * nodeRadius,
              ay = a.y + (dy / len) * nodeRadius,
              bx = b.x - (dx / len) * (nodeRadius + 4),
              by = b.y - (dy / len) * (nodeRadius + 4);
            const reverse = edges.some(
              (e) => e.from === edge.to && e.to === edge.from && e !== edge,
            );
            const curved =
              edge.kind === "random" ||
              edge.kind === "next" ||
              edge.kind === "parent" ||
              reverse;
            const path =
              a === b
                ? `M ${a.x - 16} ${a.y - 16} C ${a.x - 65} ${a.y - 80}, ${a.x + 65} ${a.y - 80}, ${a.x + 16} ${a.y - 16}`
                : curved
                  ? `M ${ax} ${ay} Q ${(ax + bx) / 2 - (dy / len) * 36} ${(ay + by) / 2 + (dx / len) * 36} ${bx} ${by}`
                  : `M ${ax} ${ay} L ${bx} ${by}`;
            const active =
              String(vars.current) === edge.from ||
              (String(vars.current) === edge.to && edge.kind === "parent");
            return (
              <motion.g
                key={
                  edge.kind === "link"
                    ? `link:${edge.from}`
                    : `${edge.from}:${edge.to}:${edge.kind ?? ""}:${i}`
                }
                initial={false}
                animate={{ opacity: 1 }}
                transition={transition}
              >
                <motion.path
                  d={path}
                  className={`viz-edge ${active ? "active" : ""} ${edge.kind ?? ""}`}
                  initial={false}
                  animate={{ d: path, pathLength: 1 }}
                  transition={transition}
                  markerEnd={
                    edge.directed === false
                      ? undefined
                      : `url(#viz-arrow-${scope})`
                  }
                />
                {edge.label && (
                  <g>
                    <rect
                      x={(ax + bx) / 2 - 20}
                      y={(ay + by) / 2 - 12}
                      width={40}
                      height={22}
                      rx={5}
                    />
                    <text
                      x={(ax + bx) / 2}
                      y={(ay + by) / 2 + 3}
                      textAnchor="middle"
                    >
                      {edge.label.slice(0, 12)}
                    </text>
                  </g>
                )}
              </motion.g>
            );
          })}
          {nodes.map((node) => {
            const labels = pointers.filter((k) => String(vars[k]) === node.id),
              active = labels.includes("current"),
              inQueue = queue.has(node.id),
              seen = visited.has(node.id),
              updated =
                vars.distance !== undefined &&
                previous.distance !== undefined &&
                changed(
                  at(vars.distance, node.id),
                  at(previous.distance, node.id),
                );
            return (
              <motion.g
                className={`viz-node ${active ? "active" : ""} ${inQueue ? "frontier" : ""} ${seen ? "visited" : ""} ${updated ? "updated" : ""} ${node.group !== undefined ? `component-${node.group % 6}` : ""} ${selected === node.id ? "selected" : ""}`}
                key={node.id}
                initial={false}
                animate={{ x: node.x, y: node.y }}
                transition={transition}
                role="button"
                tabIndex={0}
                aria-label={`Node ${node.id}, value ${node.label}${node.note ? `, ${node.note}` : ""}${labels.length ? `, ${labels.join(", ")}` : ""}`}
                aria-pressed={selected === node.id}
                onClick={() => setSelected(node.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(node.id);
                  }
                }}
              >
                <circle r={nodeRadius} />
                <text textAnchor="middle" y={5}>
                  {node.label.length > 8
                    ? node.label.slice(0, 7) + "…"
                    : node.label}
                </text>
                {node.terminal && (
                  <circle className="viz-terminal" cx={20} cy={-19} r={5} />
                )}
                <text
                  className="viz-node-note"
                  textAnchor="middle"
                  y={nodeRadius + 17}
                >
                  {node.note ?? `#${node.id}`}
                </text>
                {labels.map((label, i) => (
                  <g
                    key={label}
                    className={`viz-node-pointer ${label === "neighbor" || label === "fast" ? "amber" : "mint"}`}
                    transform={`translate(0,${-nodeRadius - 20 - i * 22})`}
                  >
                    <rect
                      x={-Math.max(28, label.length * 4)}
                      y={-12}
                      width={Math.max(56, label.length * 8)}
                      height={19}
                      rx={4}
                    />
                    <text textAnchor="middle" y={1}>
                      {label}
                    </text>
                  </g>
                ))}
              </motion.g>
            );
          })}
        </svg>
      </div>
      {!nodes.length && (
        <div className="viz-empty">
          No nodes recorded yet. Play to build this structure.
        </div>
      )}
      {selected && nodeMap.has(selected) && (
        <Readout>
          <span>Node {selected}</span>
          <b>{nodeMap.get(selected)!.label}</b>
          <span>{nodeMap.get(selected)!.note}</span>
          <span>
            {edges
              .filter(
                (e) =>
                  e.from === selected ||
                  (e.directed === false && e.to === selected),
              )
              .map(
                (e) =>
                  `${e.directed === false ? "↔" : "→"} ${e.from === selected ? e.to : e.from}${e.label ? ` (${e.label})` : ""}`,
              )
              .join(" · ") || "No outgoing connections"}
          </span>
          <button
            aria-label="Close node inspector"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
        </Readout>
      )}
    </>
  );
}
function graphModel(p: Problem, input: State, v: State) {
  const ids = new Set<string>(),
    edges: VisualEdge[] = [],
    directed = [
      "network-delay",
      "cheapest-flights",
      "course-schedule",
      "course-order",
      "alien-dictionary",
    ].includes(p.id);
  const raw = list(
    v.edges ??
      input.times ??
      input.flights ??
      input.edges ??
      input.prerequisites,
  );
  for (const item of raw) {
    const [a, b, w] = list(item);
    if (a === undefined || b === undefined) continue;
    const reverse = v.edges === undefined && input.prerequisites !== undefined;
    ids.add(String(a));
    ids.add(String(b));
    edges.push({
      from: String(reverse ? b : a),
      to: String(reverse ? a : b),
      label: w !== undefined ? text(w) : undefined,
      directed,
    });
  }
  if (input.succProb !== undefined)
    edges.forEach((edge, i) => (edge.label = text(list(input.succProb)[i])));
  const count = Number(input.n ?? input.numCourses);
  if (Number.isInteger(count))
    for (let i = 0; i < Math.min(80, count); i++)
      ids.add(String(i + (p.id === "network-delay" ? 1 : 0)));
  if (input.accounts) {
    const accounts = list(input.accounts).slice(0, 80);
    accounts.forEach((_, i) => ids.add(String(i)));
    for (let a = 0; a < accounts.length; a++) {
      const emails = new Set(list(accounts[a]).slice(1));
      for (let b = a + 1; b < accounts.length; b++) {
        const shared = list(accounts[b])
          .slice(1)
          .filter((email) => emails.has(email));
        if (shared.length)
          edges.push({
            from: String(a),
            to: String(b),
            label: `${shared.length} email`,
            directed: false,
          });
      }
    }
  }
  if (p.id === "word-ladder") {
    [input.beginWord, ...list(input.wordList)]
      .filter((x) => typeof x === "string")
      .forEach((x) => ids.add(String(x)));
    if (!raw.length) {
      const words = [...ids].slice(0, 40);
      for (let i = 0; i < words.length; i++)
        for (let j = i + 1; j < words.length; j++)
          if (
            words[i].length === words[j].length &&
            [...words[i]].filter((c, k) => c !== words[j][k]).length === 1
          )
            edges.push({ from: words[i], to: words[j], directed: false });
    }
  }
  if (p.id === "alien-dictionary")
    for (const word of list(input.words))
      for (const letter of String(word)) ids.add(letter);
  for (const [from, neighbors] of Object.entries(record(v.graph)).concat(
    Array.isArray(v.graph)
      ? v.graph.map((ns, i) => [String(i), ns] as [string, unknown])
      : [],
  )) {
    // Array-backed network-delay reserves index zero; it is not a vertex.
    if (p.id === "network-delay" && from === "0") continue;
    ids.add(from);
    for (const item of list(neighbors)) {
      const [to, w] = Array.isArray(item) ? item : [item];
      if (to === undefined) continue;
      ids.add(String(to));
      edges.push({
        from,
        to: String(to),
        label: w !== undefined ? text(w) : undefined,
        directed,
      });
    }
  }
  const unique = new Map<string, VisualEdge>();
  for (const edge of edges) {
    const key = directed
      ? `${edge.from}:${edge.to}`
      : [edge.from, edge.to].sort().join(":");
    if (!unique.has(key)) unique.set(key, edge);
  }
  const keys = [...ids]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .slice(0, 40),
    radius = Math.max(245, keys.length * 12),
    width = radius * 2 + 210,
    height = radius * 1.3 + 112,
    nodes: VisualNode[] = keys.map((id, i) => {
      const angle = (i / Math.max(1, keys.length)) * 2 * Math.PI - Math.PI / 2;
      const distance = at(v.distance, id),
        indegree = at(v.indegree, id);
      return {
        id,
        label:
          p.id === "accounts-merge"
            ? String(
                list(input.accounts)[Number(id)] &&
                  list(list(input.accounts)[Number(id)])[0],
              )
            : id,
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * 0.65 * Math.sin(angle),
        note:
          distance !== undefined
            ? `${p.id === "maximum-probability" ? "p" : "cost"} ${distanceText(distance)}`
            : indegree !== undefined
              ? `needs ${text(indegree)}`
              : v.parent !== undefined
                ? `root ${rootOf(v.parent, id)}`
                : `#${id}`,
        group:
          v.parent !== undefined
            ? Math.max(0, keys.indexOf(rootOf(v.parent, id)))
            : undefined,
      };
    });
  return { nodes, edges: [...unique.values()], total: ids.size, width, height };
}
function distanceText(v: unknown) {
  return v === "inf" ||
    v === "Infinity" ||
    v === 2147483647 ||
    v === 2305843009213693951 ||
    v === 2305843009213694000
    ? "∞"
    : text(v);
}
export function GraphStage({
  problem: p,
  input,
  frame,
  previous,
  speed,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? {},
    model = graphModel(p, input, v),
    parent = v.parent !== undefined;
  return (
    <div className="viz-graph-stage">
      <StageLabel
        title={
          parent
            ? "Components & representatives"
            : p.group === 15
              ? "Prerequisites → ready queue → order"
              : p.id === "word-ladder"
                ? "One-letter transformation graph"
                : "Compare routes through the graph"
        }
        detail={
          model.edges.some((e) => e.directed)
            ? "Directed connections"
            : "Undirected connections"
        }
      />
      <NetworkCanvas
        {...model}
        nodeRadius={34}
        vars={v}
        previous={previous?.vars}
        speed={speed}
      />
      {model.total > 40 && (
        <p className="viz-helper">Showing 40 of {model.total} vertices.</p>
      )}
      <Legend
        items={[
          ["active", "Current node"],
          ["frontier", "Queued"],
          ["updated", "Recorded cost changed"],
          parent
            ? ["component-1", "Shared colour = shared root"]
            : ["visited", "Recorded visited"],
        ]}
      />
      <Stats
        vars={v}
        keys={
          [
            ["components", "Components"],
            ["cost", "Current cost"],
            ["probability", "Probability"],
            ["round", "Round"],
            ["stops", "Round"],
            ["distance", "Recorded distances"],
          ].filter(([k]) => k !== "distance") as [string, string][]
        }
      />
      {v.queue !== undefined && (
        <Track
          title="Ready queue · next on the left"
          values={v.queue}
          tone="frontier"
        />
      )}
      {v.heap !== undefined && (
        <Track
          title="Priority frontier · recorded entries"
          values={v.heap}
          tone="frontier"
        />
      )}
      {p.group === 15 && (
        <Track title="Output order" values={v.order ?? v.result} />
      )}
      <Details
        vars={v}
        exclude={[
          "graph",
          "queue",
          "heap",
          "parent",
          "edges",
          "order",
          "result",
        ]}
      />
    </div>
  );
}
export function TreeStage({
  problem: p,
  input,
  frame,
  previous,
  speed,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? {},
    original = readTree(list(input.tree)),
    values = list(v.nodes).length
      ? list(v.nodes)
      : original.map((n) => n.value),
    left = list(v.left_child).length
      ? list(v.left_child)
      : original.map((n) => n.left ?? -1),
    right = list(v.right_child).length
      ? list(v.right_child)
      : original.map((n) => n.right ?? -1),
    nodes: VisualNode[] = [],
    edges: VisualEdge[] = [];
  const seen = new Set<number>();
  let x = 0,
    depth = 0;
  const place = (id: number, d: number) => {
    if (id < 0 || id >= values.length || seen.has(id) || seen.size >= 60)
      return;
    seen.add(id);
    depth = Math.max(depth, d);
    place(Number(left[id]), d + 1);
    nodes.push({
      id: String(id),
      label: text(values[id]),
      x: 55 + x++ * 66,
      y: 80 + d * 82,
      note: `#${id}`,
    });
    place(Number(right[id]), d + 1);
    for (const child of [left[id], right[id]])
      if (integer(child) && child >= 0)
        edges.push({ from: String(id), to: String(child), directed: true });
  };
  place(0, 0);
  if (p.id === "next-right-pointers")
    list(v.links).forEach((to, i) => {
      if (integer(to) && to >= 0)
        edges.push({
          from: String(i),
          to: String(to),
          label: "next",
          kind: "next",
          directed: true,
        });
    });
  const width = Math.max(420, x * 66 + 60);
  return (
    <div className="viz-tree-stage">
      <StageLabel
        title={
          p.group === 10
            ? "Visit the tree level by level"
            : "Explore children, return to the parent"
        }
        detail="Node value inside · identity below"
      />
      <NetworkCanvas
        nodes={nodes}
        edges={edges}
        vars={v}
        previous={previous?.vars}
        speed={speed}
        width={width}
        height={Math.max(250, depth * 82 + 150)}
      />
      {values.length > 60 && (
        <p className="viz-helper">Showing the first 60 reachable nodes.</p>
      )}
      <Legend
        items={[
          ["active", "Current node"],
          ["frontier", "Queued"],
          ...(p.id === "next-right-pointers"
            ? [["dependency", "Next connection"] as [string, string]]
            : []),
        ]}
      />
      {v.queue !== undefined && (
        <Track
          title="BFS queue · node identities"
          values={v.queue}
          tone="frontier"
        />
      )}
      <Stats
        vars={v}
        keys={[
          ["a", "Left contribution"],
          ["b", "Right contribution"],
          ["depth", "Returned depth"],
          ["best", "Best so far"],
        ]}
      />
      {v.result !== undefined && (
        <Track title="Recorded output" values={v.result} />
      )}
      <Details
        vars={v}
        exclude={["nodes", "left_child", "right_child", "queue", "result"]}
      />
    </div>
  );
}
export function LinkedStage({
  problem: p,
  input,
  frame,
  previous,
  speed,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? {},
    values = list(v.nodes ?? v.nums ?? input.values ?? input.nums),
    links = list(
      v.links ??
        (p.id === "duplicate-number"
          ? input.nums
          : values.map((_, i) =>
              i + 1 < values.length ? i + 1 : (input.pos ?? -1),
            )),
    );
  const nodes = values.slice(0, 40).map((value, i) => ({
      id: String(i),
      label: text(value),
      x: 60 + (i % 7) * 93,
      y: 110 + Math.floor(i / 7) * 120,
    })),
    edges: VisualEdge[] = links.map((to, i) => ({
      from: String(i),
      to: String(to),
      directed: true,
      kind: "link",
    }));
  if (p.id === "copy-random-list")
    list(input.random).forEach((to, i) => {
      if (to !== null)
        edges.push({
          from: String(i),
          to: String(to),
          label: "random",
          kind: "random",
          directed: true,
        });
    });
  return (
    <div>
      <StageLabel
        title="Follow pointers between nodes"
        detail="Value inside · zero-based identity below"
      />
      <NetworkCanvas
        nodes={nodes}
        edges={edges}
        vars={v}
        previous={previous?.vars}
        speed={speed}
        height={Math.max(260, Math.ceil(nodes.length / 7) * 120 + 70)}
      />
      <Legend
        items={[
          ["active", "Current node"],
          ["amber", "Fast / next pointer"],
          ["dependency", "Random connection"],
        ]}
      />
      {values.length > 40 && (
        <p className="viz-helper">
          Showing the first 40 of {values.length} nodes.
        </p>
      )}
      <Details vars={v} exclude={["nodes", "nums", "links"]} />
    </div>
  );
}
export function TrieStage({
  input,
  frame,
  previous,
  speed,
}: {
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
}) {
  const v = frame?.vars ?? {},
    nodes: VisualNode[] = [],
    edges: VisualEdge[] = [],
    levels: Record<number, VisualNode[]> = {};
  const walk = (branch: State, id: string, d: number, label: string) => {
    if (nodes.length >= 60) return;
    const n = {
      id,
      label,
      x: 0,
      y: 80 + d * 80,
      note: id === "root" ? "empty prefix" : id.slice(5),
      terminal: branch.$ !== undefined,
    };
    nodes.push(n);
    (levels[d] ??= []).push(n);
    for (const [key, value] of Object.entries(branch)) {
      if (key === "$" || !value || typeof value !== "object") continue;
      const child = id + key;
      edges.push({ from: id, to: child, directed: true });
      walk(record(value), child, d + 1, key);
    }
  };
  if (v.trie !== undefined) walk(record(v.trie), "root", 0, "∅");
  const width = Math.max(
    500,
    ...Object.values(levels).map((ns) => ns.length * 76 + 60),
  );
  for (const ns of Object.values(levels))
    ns.forEach((n, i) => (n.x = (width * (i + 1)) / (ns.length + 1)));
  return (
    <div>
      <StageLabel
        title="Shared prefixes form a trie"
        detail="Dot = complete word"
      />
      <NetworkCanvas
        nodes={nodes}
        edges={edges}
        vars={{}}
        speed={speed}
        width={width}
        height={Math.max(260, Object.keys(levels).length * 80 + 90)}
      />
      <Stats
        vars={v}
        keys={[
          ["word", "Current word"],
          ["prefix", "Prefix"],
          ["char", "Letter"],
        ]}
      />
      <Track
        title="Operations / dictionary"
        values={input.operations ?? input.dictionary ?? input.words}
      />
      {v.result !== undefined && (
        <Track title="Recorded results" values={v.result} />
      )}
      <Details vars={v} exclude={["trie", "result"]} />
    </div>
  );
}
export function HeapStage({
  problem: p,
  input,
  frame,
  previous,
  speed,
  language,
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
  language?: string;
}) {
  const v = frame?.vars ?? {},
    keys = p.id === "median-stream" ? ["lower", "upper"] : ["heap"];
  return (
    <div>
      <StageLabel
        title={
          p.id === "median-stream"
            ? "Balance the two middle candidates"
            : "Read the root, restore heap order"
        }
        detail="Array-backed heap · indices below nodes"
      />
      <Track
        title="Input sequence"
        values={input.nums ?? input.tasks ?? input.lists}
      />
      {keys.map((key) => {
        const values = list(v[key]);
        const negated =
          language === "python" &&
          (key === "lower" || p.id === "task-scheduler");
        const nodes = values.slice(0, 31).map((value, i) => {
          const d = Math.floor(Math.log2(i + 1)),
            frequencyPair =
              p.id === "top-k-frequent" &&
              Array.isArray(value) &&
              value.length === 2
                ? value
                : undefined;
          return {
            id: String(i),
            label: text(
              frequencyPair
                ? frequencyPair[1]
                : negated && typeof value === "number"
                  ? -value
                  : value,
            ),
            x: (700 * (i - (2 ** d - 1) + 0.5)) / 2 ** d,
            y: 65 + d * 72,
            note: frequencyPair
              ? `freq ${Math.abs(Number(frequencyPair[0]))} · #${i}`
              : i === 0
                ? "root"
                : `#${i}`,
          };
        });
        return (
          <section key={key}>
            <StageLabel
              title={
                key === "lower"
                  ? "Lower half · max-heap"
                  : key === "upper"
                    ? "Upper half · min-heap"
                    : "Priority heap"
              }
              detail={
                p.id === "top-k-frequent"
                  ? "Value inside · frequency below; signed priorities decoded"
                  : negated
                    ? "Python negation decoded for display"
                    : undefined
              }
            />
            <NetworkCanvas
              nodes={nodes}
              edges={nodes.slice(1).map((n) => ({
                from: String(Math.floor((Number(n.id) - 1) / 2)),
                to: n.id,
                directed: false,
              }))}
              vars={{ current: values.length ? 0 : undefined }}
              speed={speed}
              height={Math.max(
                180,
                Math.ceil(Math.log2(values.length + 1)) * 72 + 65,
              )}
            />
            {values.length > 31 && (
              <p className="viz-helper">
                Showing the first 31 of {values.length} heap entries.
              </p>
            )}
          </section>
        );
      })}
      <Stats
        vars={v}
        keys={[
          ["median", "Median"],
          ["time", "Time"],
          ["i", "Input index"],
        ]}
      />
      {v.queue !== undefined && (
        <Track
          title="Cooldown queue · recorded [ready time, remaining]"
          values={v.queue}
          tone="frontier"
        />
      )}
      {v.result !== undefined && (
        <Track title="Recorded output" values={v.result} />
      )}
      <Details
        vars={v}
        exclude={["heap", "lower", "upper", "queue", "result"]}
      />
    </div>
  );
}
