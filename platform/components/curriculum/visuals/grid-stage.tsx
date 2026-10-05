"use client";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Crown,
} from "lucide-react";
import type { Problem } from "@/lib/curriculum/catalog";
import type { PlaybackFrame } from "@/lib/curriculum/execution";
import {
  gridData,
  gridCursor,
  cells,
  matrix,
  text,
  changed,
  list,
  rootOf,
  at,
  type State,
} from "@/lib/curriculum/visual-state";
import {
  StageLabel,
  Readout,
  Legend,
  Stats,
  Track,
  Details,
  useStageMotion,
} from "./shared";
export type GridMark = { tone: string; label: string };
export function MatrixCanvas({
  values,
  name,
  focus,
  marks = {},
  rowLabels = [],
  colLabels = [],
  original = [],
  chess = false,
  speed = 1,
  previous = [],
}: {
  values: unknown[][];
  name: string;
  focus?: [number, number];
  marks?: Record<string, GridMark>;
  rowLabels?: string[];
  colLabels?: string[];
  original?: unknown[][];
  chess?: boolean;
  speed?: number;
  previous?: unknown[][];
}) {
  const [selected, setSelected] = useState<[number, number] | null>(null),
    [manual, setManual] = useState<[number, number] | null>(null);
  const transition = useStageMotion(speed),
    cols = Math.max(0, ...values.map((r) => r.length)),
    rows = values.length;
  const centre = manual ?? focus ?? [0, 0],
    startR = Math.max(0, Math.min(Math.max(0, rows - 6), centre[0] - 2)),
    startC = Math.max(0, Math.min(Math.max(0, cols - 10), centre[1] - 4));
  const rs = Array.from(
      { length: Math.min(6, rows - startR) },
      (_, i) => i + startR,
    ),
    cs = Array.from(
      { length: Math.min(10, cols - startC) },
      (_, i) => i + startC,
    );
  const cellSize =
    rows > 4 ? 32 : cols > 8 ? 38 : rows === 4 || cols > 6 ? 46 : 54;
  const active = focus && rs.includes(focus[0]) && cs.includes(focus[1]);
  return (
    <div className="viz-matrix-section">
      {(rows > 6 || cols > 10) && (
        <div className="viz-window-controls">
          <span>
            Rows {startR}–{rs.at(-1)}, columns {startC}–{cs.at(-1)}
          </span>
          <button
            aria-label="Pan grid up"
            disabled={startR === 0}
            onClick={() => setManual([startR - 2, centre[1]])}
          >
            <ChevronUp size={14} />
          </button>
          <button
            aria-label="Pan grid down"
            disabled={startR + 6 >= rows}
            onClick={() => setManual([startR + 6, centre[1]])}
          >
            <ChevronDown size={14} />
          </button>
          <button
            aria-label="Pan grid left"
            disabled={startC === 0}
            onClick={() => setManual([centre[0], startC])}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            aria-label="Pan grid right"
            disabled={startC + 10 >= cols}
            onClick={() => setManual([centre[0], startC + 8])}
          >
            <ChevronRight size={14} />
          </button>
          <button onClick={() => setManual(null)}>Follow step</button>
        </div>
      )}
      <div
        className="viz-matrix-scroll"
        tabIndex={0}
        aria-label={`${name}, ${rows} rows and ${cols} columns`}
      >
        {rows && cols ? (
          <div
            className={`viz-matrix ${chess ? "viz-chess" : ""}`}
            style={{
              gridTemplateColumns: `30px repeat(${cs.length},${cellSize}px)`,
            }}
          >
            <span className="viz-axis-corner">r/c</span>
            {cs.map((c) => (
              <span className="viz-axis" key={`c${c}`}>
                <b>{colLabels[c] ?? c}</b>
                {colLabels.length > 0 && <small>{c}</small>}
              </span>
            ))}
            {rs.map((r) => (
              <div className="viz-matrix-row" key={r}>
                <span className="viz-axis">
                  <b>{rowLabels[r] ?? r}</b>
                  {rowLabels.length > 0 && <small>{r}</small>}
                </span>
                {cs.map((c) => {
                  const value = values[r]?.[c],
                    mark = marks[`${r},${c}`],
                    updated =
                      previous[r] !== undefined &&
                      changed(previous[r]?.[c], value),
                    isFocus = focus?.[0] === r && focus?.[1] === c;
                  return (
                    <motion.button
                      type="button"
                      key={`${r},${c}`}
                      initial={false}
                      animate={{ scale: updated ? 1.035 : 1 }}
                      transition={transition}
                      className={`viz-cell ${mark?.tone ?? ""} ${isFocus ? "active" : ""} ${updated ? "updated" : ""} ${selected?.[0] === r && selected?.[1] === c ? "selected" : ""} ${chess && (r + c) % 2 ? "dark-square" : ""}`}
                      aria-label={`${name}[${r}][${c}] = ${text(value)}${mark ? `, ${mark.label}` : ""}${isFocus ? ", current indices" : ""}`}
                      aria-pressed={selected?.[0] === r && selected?.[1] === c}
                      onClick={() => setSelected([r, c])}
                      title={mark?.label ?? text(value)}
                    >
                      {chess && value === "Q" ? (
                        <motion.span
                          key="queen"
                          initial={{ scale: 0.4 }}
                          animate={{ scale: 1 }}
                          transition={transition}
                        >
                          <Crown size={24} />
                        </motion.span>
                      ) : (
                        <span key={text(value)}>
                          {chess && value === "."
                            ? ""
                            : text(value).length > 6
                              ? text(value).slice(0, 5) + "…"
                              : text(value)}
                        </span>
                      )}
                      {mark?.label === "Visited" && (
                        <i className="viz-visit-dot" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            ))}
            {active && (
              <motion.div
                className="viz-grid-cursor"
                initial={false}
                animate={{
                  x: 35 + (focus[1] - startC) * (cellSize + 5),
                  y: 38 + (focus[0] - startR) * (cellSize + 5),
                }}
                transition={transition}
                style={{ width: cellSize, height: cellSize }}
                aria-hidden="true"
              />
            )}
          </div>
        ) : (
          <div className="viz-empty">
            Empty grid. Explore this boundary input.
          </div>
        )}
      </div>
      {selected && values[selected[0]] && (
        <Readout>
          <span>
            {name}[{selected[0]}][{selected[1]}]
          </span>
          <strong>{text(values[selected[0]][selected[1]])}</strong>
          {original[selected[0]] &&
            changed(
              original[selected[0]][selected[1]],
              values[selected[0]][selected[1]],
            ) && <span>Input: {text(original[selected[0]][selected[1]])}</span>}
          <span>{marks[selected.join(",")]?.label}</span>
          <button
            aria-label="Close cell inspector"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
        </Readout>
      )}
    </div>
  );
}
export function GridStage({
  problem: p,
  input,
  frame,
  previous,
  speed,
  source = "",
}: {
  problem: Problem;
  input: State;
  frame?: PlaybackFrame;
  previous?: PlaybackFrame;
  speed?: number;
  source?: string;
}) {
  const v = frame?.vars ?? {},
    g = gridData(p, input, v),
    old = matrix(previous?.vars[g.name]),
    focus = gridCursor(v, source),
    marks: Record<string, GridMark> = {};
  const visited = cells(v.visited),
    frontier = cells(
      v.queue ??
        v.stack ??
        (p.id === "swim-water"
          ? list(v.heap).map((entry) => list(entry).slice(1))
          : undefined),
    ),
    path = cells(v.path),
    pacific = cells(v.pacific),
    atlantic = cells(v.atlantic);
  const island = ["number-islands", "max-island-area", "islands-ii"].includes(
      p.id,
    ),
    orange = p.id === "rotting-oranges",
    ocean = p.id === "pacific-atlantic",
    word = p.id === "word-search-ii",
    queens = p.id === "n-queens";
  const placed = g.values.flatMap((row, r) =>
    row.map((x, c) => (x === "Q" ? [r, c] : null)).filter(Boolean),
  ) as number[][];
  for (let r = 0; r < g.values.length; r++)
    for (let c = 0; c < g.values[r].length; c++) {
      const value = g.values[r][c],
        key = `${r},${c}`;
      let tone = "",
        label = "";
      if (island) {
        const land =
          String(value) === "1" || String(g.original[r]?.[c]) === "1";
        tone = land ? "land" : "water";
        label = land ? "Land" : "Water";
        if (visited.has(key) || (land && String(value) === "0")) {
          tone = "visited";
          label = "Visited";
        }
        if (p.id === "islands-ii" && String(value) === "1") {
          const root = rootOf(v.parent, String(r * g.values[0].length + c));
          tone = `component-${Math.abs(Number(root) || 0) % 6}`;
          label = `Land · component root ${root}`;
        }
      }
      if (orange) {
        tone =
          Number(value) === 2
            ? "rotten"
            : Number(value) === 1
              ? "fresh"
              : "empty";
        label =
          Number(value) === 2
            ? "Rotten orange"
            : Number(value) === 1
              ? "Fresh orange"
              : "Empty cell";
      }
      if (ocean) {
        tone =
          pacific.has(key) && atlantic.has(key)
            ? "both-oceans"
            : pacific.has(key)
              ? "pacific"
              : atlantic.has(key)
                ? "atlantic"
                : visited.has(key)
                  ? "visited"
                  : "";
        label =
          pacific.has(key) && atlantic.has(key)
            ? "Reached from both oceans"
            : pacific.has(key)
              ? "Reached from Pacific"
              : atlantic.has(key)
                ? "Reached from Atlantic"
                : visited.has(key)
                  ? "Recorded visit"
                  : "Height";
      }
      if (word && (value === "#" || path.has(key))) {
        tone = "visited";
        label = "Used in the current word path";
      }
      if (queens) {
        const attackers = placed.filter(
          ([a, b]) =>
            (a !== r || b !== c) &&
            (a === r || b === c || Math.abs(a - r) === Math.abs(b - c)),
        );
        if (value === "Q") {
          tone = "queen";
          label = "Placed queen";
        } else if (attackers.length) {
          tone = "attacked";
          label = `Attacked by ${attackers.length} placed queen${attackers.length > 1 ? "s" : ""}`;
        }
      }
      if (
        p.id === "search-matrix" &&
        typeof v.left === "number" &&
        typeof v.right === "number"
      ) {
        const i = r * g.values[0].length + c;
        if (i < v.left || i > v.right) {
          tone = "eliminated";
          label = "Outside current search interval";
        }
      }
      if (visited.has(key) && !tone) {
        tone = "visited";
        label = "Visited";
      }
      if (frontier.has(key)) {
        tone = "frontier";
        label = "Waiting in frontier";
      }
      if (tone) marks[key] = { tone, label };
    }
  const title = queens
    ? "Choose a safe square"
    : orange
      ? "Watch the rot spread"
      : island
        ? "Explore connected land"
        : ocean
          ? "Reach both ocean borders"
          : word
            ? "Follow a word path"
            : p.id === "search-matrix"
              ? "Binary search on a grid"
              : p.id === "swim-water"
                ? "Find the lowest elevation route"
                : "Place values in the grid";
  return (
    <div className="viz-grid-stage">
      <StageLabel
        title={title}
        detail={`${g.values.length} × ${g.values[0]?.length ?? 0}`}
      />
      {ocean && (
        <div className="viz-ocean-borders">
          <span>Pacific · top & left</span>
          <span>Atlantic · bottom & right</span>
        </div>
      )}
      <MatrixCanvas
        values={g.values}
        original={g.original}
        previous={old}
        name={g.name}
        focus={focus}
        marks={marks}
        chess={queens}
        speed={speed}
      />
      <Legend
        items={
          queens
            ? [
                ["queen", "Placed queen"],
                ["attacked", "Attacked square"],
                ["active", "Current indices"],
              ]
            : orange
              ? [
                  ["fresh", "Fresh"],
                  ["rotten", "Rotten"],
                  ["frontier", "Queued"],
                  ["active", "Current indices"],
                ]
              : island
                ? [
                    ["land", "Land"],
                    ["water", "Water"],
                    ["visited", "Visited"],
                    ["frontier", "Frontier"],
                  ]
                : ocean
                  ? [
                      ["pacific", "Pacific"],
                      ["atlantic", "Atlantic"],
                      ["both-oceans", "Both"],
                      ["visited", "Recorded visit"],
                    ]
                  : [
                      ["active", "Current indices"],
                      ["visited", "Visited / used"],
                      ["updated", "Changed"],
                    ]
        }
      />
      <Stats
        vars={v}
        keys={[
          ["islands", "Islands"],
          ["count", "Count"],
          ["area", "Island area"],
          ["best", "Best"],
          ["fresh", "Fresh counter"],
          ["time", "Minute"],
          ["minutes", "Minute"],
          ["cost", "Path cost"],
        ]}
      />
      {v.queue !== undefined && (
        <Track
          title="Queue · next cell on the left"
          values={v.queue}
          tone="frontier"
        />
      )}
      {v.stack !== undefined && (
        <Track
          title="DFS frontier · next cell on the right"
          values={v.stack}
          tone="frontier"
        />
      )}
      {p.id === "swim-water" && v.heap !== undefined && (
        <Track
          title="Priority frontier · [cost, row, column]"
          values={v.heap}
          tone="frontier"
        />
      )}
      {queens && (
        <Stats
          vars={{ placed: placed.length, solutions: list(v.result).length }}
          keys={[
            ["placed", "Queens placed"],
            ["solutions", "Solutions recorded"],
          ]}
        />
      )}
      {word && v.found !== undefined && (
        <Track title="Words found" values={v.found} />
      )}
      {p.id === "build-matrix" && (
        <>
          <Track
            title="Row constraints · before → after"
            values={input.rowConditions}
          />
          <Track
            title="Column constraints · before → after"
            values={input.colConditions}
          />
          <Track title="Row order · recorded" values={v.rows ?? v.order} />
          <Track title="Column order · recorded" values={v.cols} />
        </>
      )}
      <Details
        vars={v}
        exclude={[
          g.name,
          "queue",
          "stack",
          "visited",
          "path",
          "result",
          "pacific",
          "atlantic",
        ]}
      />
    </div>
  );
}
