"use client";
import { useTraceReducedMotion } from "@/components/experience/use-preferences";
import { useId, useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowDown, Check, MousePointer2 } from "lucide-react";
import type { ConceptCue } from "@/lib/curriculum/concept-cues";
import { arrayLayout } from "@/lib/experience/array-layout";
const format = (value: unknown) =>
  typeof value === "string" ? value : (JSON.stringify(value) ?? "—");
const markers = [
  "left",
  "right",
  "mid",
  "i",
  "j",
  "slow",
  "fast",
  "current",
  "previous",
  "following",
  "start",
  "end",
];
export function ArrayStage({
  name,
  values,
  state,
  previous,
  cue,
  duration,
  range,
  found = [],
}: {
  name: string;
  values: unknown[];
  state: Record<string, unknown>;
  previous?: unknown[];
  cue?: ConceptCue;
  duration: number;
  range?: [number, number];
  found?: number[];
}) {
  const reduced = useTraceReducedMotion(),
    scope = useId(),
    [selected, setSelected] = useState<number | null>(null);
  const viewport = useRef<HTMLDivElement>(null),
    [width, setWidth] = useState(0);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const shown = values.slice(0, 100),
    pointers = markers.filter(
      (k) =>
        Number.isInteger(state[k]) &&
        Number(state[k]) >= 0 &&
        Number(state[k]) < shown.length,
    );
  const rows = Math.max(
    1,
    ...pointers.map(
      (k) => pointers.filter((p) => state[p] === state[k]).length,
    ),
  );
  const tileTop = pointers.length ? rows * 24 + 16 : 12,
    counts = new Map<string, number>();
  const layout = arrayLayout(
      shown.length,
      width,
      tileTop + 90 + (cue ? 28 : 0),
    ),
    { columns, gap, tile } = layout;
  const x = (i: number) => (i % columns) * gap,
    y = (i: number) => Math.floor(i / columns) * layout.rowHeight;
  const transition = {
    duration: reduced ? 0 : duration,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  };
  return (
    <section className="roadmap-array" aria-label={`${name} visualization`}>
      <div className="stage-topline">
        <span>{name}</span>
        <span className="stage-size">{values.length} values</span>
      </div>
      <div
        ref={viewport}
        className="motion-scroll responsive-array"
        aria-label={`${name} values, in index order`}
      >
        <div
          className="motion-canvas"
          style={{ width: layout.width, height: layout.height }}
        >
          {range &&
            range[0] <= range[1] &&
            Array.from({ length: layout.rows }, (_, row) => {
              const start = Math.max(range[0], row * columns),
                end = Math.min(
                  range[1],
                  (row + 1) * columns - 1,
                  shown.length - 1,
                );
              return start <= end ? (
                <motion.div
                  key={row}
                  className="moving-region search-region"
                  initial={false}
                  animate={{
                    x: x(start) - 3,
                    width: (end - start) * gap + tile + 6,
                  }}
                  transition={transition}
                  style={{ top: tileTop - 6 + row * layout.rowHeight }}
                />
              ) : null;
            })}
          {pointers.map((pointer, i) => {
            const row = pointers
              .slice(0, i)
              .filter((p) => state[p] === state[pointer]).length;
            return (
              <motion.div
                key={pointer}
                className={`moving-pointer ${pointer === "right" || pointer === "j" ? "amber" : pointer === "mid" ? "blue" : "mint"}`}
                initial={false}
                animate={{
                  x: x(Number(state[pointer])),
                  y: y(Number(state[pointer])) + row * 24,
                }}
                transition={transition}
                style={{ width: tile }}
              >
                <span>{pointer}</span>
                <ArrowDown size={14} />
              </motion.div>
            );
          })}
          <div className="motion-tiles" style={{ top: tileTop, width: "100%" }}>
            {shown.map((value, i) => {
              const identity = format(value),
                occurrence = counts.get(identity) ?? 0;
              counts.set(identity, occurrence + 1);
              const changed =
                  previous !== undefined && format(previous[i]) !== identity,
                mark = cue?.marks[i];
              return (
                <motion.button
                  style={{
                    position: "absolute",
                    left: x(i),
                    top: y(i),
                    width: tile,
                  }}
                  layout={!reduced}
                  layoutId={`${scope}-${identity}-${occurrence}`}
                  key={`${identity}:${occurrence}`}
                  transition={transition}
                  className={`motion-tile ${changed ? "read-tile" : ""} ${range && (i < range[0] || i > range[1]) && !mark ? "eliminated-tile" : ""} ${found.includes(i) ? "found-tile" : ""} ${selected === i ? "selected-tile" : ""} ${mark ? "roadmap-marked" : ""}`}
                  aria-label={`${name}[${i}] = ${identity}${mark ? `, ${mark}` : ""}. Inspect value`}
                  aria-pressed={selected === i}
                  onClick={() => setSelected(selected === i ? null : i)}
                >
                  <span title={identity}>
                    {identity.length > 8
                      ? identity.slice(0, 7) + "…"
                      : identity}
                  </span>
                  <small>{i}</small>
                  {mark && (
                    <em
                      className={`roadmap-cell-cue ${mark === "leaves" ? "amber" : "mint"}`}
                    >
                      {mark}
                    </em>
                  )}
                  {found.includes(i) && (
                    <Check className="tile-check" size={13} />
                  )}
                </motion.button>
              );
            })}
            {!shown.length && (
              <div className="empty-stage">
                Empty collection
                <span>Step through to explore the boundary case.</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {selected !== null && selected < values.length && (
        <div className="stage-readout">
          <MousePointer2 size={15} />
          <span>
            {name}[{selected}]
          </span>
          <strong>{format(values[selected])}</strong>
          <button
            onClick={() => setSelected(null)}
            aria-label="Close value inspector"
          >
            ×
          </button>
        </div>
      )}
      {values.length > 100 && (
        <p className="trace-notice">
          Showing the first 100 of {values.length} values.
        </p>
      )}
    </section>
  );
}
